import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sessionExpiry, setSessionCookie, signSessionToken } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/services/audit.service";

const schema = z.object({
  businessName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  plan: z.enum(["FREE", "STARTER", "ADVANCED"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const baseSlug = slugify(body.businessName) || "shop";
    let slug = baseSlug;
    let n = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const verifyToken = randomBytes(24).toString("hex");
    const plan = body.plan && body.plan !== "FREE" ? body.plan : "FREE";

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: body.businessName,
          slug,
          email,
          phone: body.phone,
          settings: { create: {} },
          subscription: {
            create: {
              plan,
              status: plan === "FREE" ? "TRIALING" : "TRIALING",
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        },
      });

      const defaults = [
        { name: "Each", abbreviation: "ea" },
        { name: "Pack", abbreviation: "pk" },
        { name: "Litre", abbreviation: "L" },
        { name: "Kilogram", abbreviation: "kg" },
      ];
      await tx.unit.createMany({
        data: defaults.map((u) => ({ ...u, businessId: business.id })),
      });

      const categories = ["Beverages", "Bread & Bakery", "Groceries", "Dairy", "Snacks", "Household"];
      await tx.category.createMany({
        data: categories.map((name, i) => ({ businessId: business.id, name, sortOrder: i })),
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          email,
          phone: body.phone,
          passwordHash,
          fullName: body.fullName,
          role: "OWNER",
          verifyToken,
          emailVerified: false,
        },
      });

      return { business, user };
    });

    const expiresAt = sessionExpiry();
    const refresh = randomBytes(32).toString("hex");
    const session = await prisma.session.create({
      data: {
        userId: result.user.id,
        refreshTokenHash: await bcrypt.hash(refresh, 8),
        expiresAt,
      },
    });

    const payload = {
      sessionId: session.id,
      userId: result.user.id,
      businessId: result.business.id,
      role: result.user.role,
      email: result.user.email,
      fullName: result.user.fullName,
    };

    const token = await signSessionToken(payload, expiresAt);
    await setSessionCookie(token, expiresAt);
    await writeAuditLog({
      businessId: result.business.id,
      userId: result.user.id,
      action: "CREATE",
      entityType: "business",
      entityId: result.business.id,
      summary: `Business ${result.business.name} created`,
    });

    return NextResponse.json({
      user: payload,
      verifyToken,
      message: "Account created. Check email to verify (dev token returned).",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
