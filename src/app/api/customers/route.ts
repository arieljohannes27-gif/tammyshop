import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const customers = await prisma.customer.findMany({
      where: {
        businessId: session.businessId,
        deletedAt: null,
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());
    const customer = await prisma.customer.create({
      data: {
        businessId: session.businessId,
        name: body.name,
        email: body.email || null,
        phone: body.phone,
        address: body.address,
        notes: body.notes,
      },
    });
    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "CREATE", entityType: "customer", entityId: customer.id, summary: `Added customer ${customer.name}` });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
