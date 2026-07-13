import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBusinessPlan, requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";

export async function GET() {
  try {
    const session = await requireSession();
    const suppliers = await prisma.supplier.findMany({
      where: { businessId: session.businessId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ suppliers });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const schema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  leadTimeDays: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const plan = await getBusinessPlan(session.businessId);
    if (!plan.suppliers) return NextResponse.json({ error: "Suppliers require Advanced plan" }, { status: 402 });
    const body = schema.parse(await req.json());
    const supplier = await prisma.supplier.create({
      data: {
        businessId: session.businessId,
        name: body.name,
        contactName: body.contactName,
        email: body.email || null,
        phone: body.phone,
        address: body.address,
        city: body.city,
        notes: body.notes,
        leadTimeDays: body.leadTimeDays ?? 3,
      },
    });
    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "CREATE", entityType: "supplier", entityId: supplier.id, summary: `Added supplier ${supplier.name}` });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
