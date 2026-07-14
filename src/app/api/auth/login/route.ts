import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sessionExpiry, setSessionCookie, signSessionToken } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";
import { randomBytes } from "crypto";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || user.deletedAt || !user.isActive) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const expiresAt = sessionExpiry();
    const refresh = randomBytes(32).toString("hex");
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: await bcrypt.hash(refresh, 8),
        expiresAt,
      },
    });

    const payload = {
      sessionId: session.id,
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      isPlatformAdmin: user.isPlatformAdmin,
    };

    const token = await signSessionToken(payload, expiresAt);
    await setSessionCookie(token, expiresAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await writeAuditLog({
      businessId: user.businessId,
      userId: user.id,
      action: "LOGIN",
      entityType: "user",
      entityId: user.id,
      summary: `${user.fullName} signed in`,
    });

    return NextResponse.json({ user: payload });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
