import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBusinessPlan, requirePaidSession } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";

export async function GET() {
  try {
    const session = await requirePaidSession();
    const orders = await prisma.purchaseOrder.findMany({
      where: { businessId: session.businessId },
      include: { supplier: true, items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const schema = z.object({
  supplierId: z.string(),
  notes: z.string().optional(),
  expectedAt: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantityOrdered: z.number().positive(),
    unitCostCents: z.number().int().min(0),
  })).min(1),
});

export async function POST(req: Request) {
  try {
    const session = await requirePaidSession();
    const plan = await getBusinessPlan(session.businessId);
    if (!plan.purchaseOrders) return NextResponse.json({ error: "Purchase orders require Advanced plan" }, { status: 402 });
    const body = schema.parse(await req.json());
    const products = await prisma.product.findMany({ where: { id: { in: body.items.map(i => i.productId) }, businessId: session.businessId } });
    const byId = new Map(products.map(p => [p.id, p]));
    const count = await prisma.purchaseOrder.count({ where: { businessId: session.businessId } });
    const orderNumber = `PO-${String(count + 1).padStart(5, "0")}`;
    let subtotal = 0;
    const items = body.items.map(i => {
      const p = byId.get(i.productId);
      if (!p) throw new Error("PRODUCT_NOT_FOUND");
      const total = Math.round(i.quantityOrdered * i.unitCostCents);
      subtotal += total;
      return { productId: i.productId, productName: p.name, quantityOrdered: i.quantityOrdered, unitCostCents: i.unitCostCents, totalCents: total };
    });

    const order = await prisma.purchaseOrder.create({
      data: {
        businessId: session.businessId,
        supplierId: body.supplierId,
        orderNumber,
        status: "SENT",
        subtotalCents: subtotal,
        totalCents: subtotal,
        notes: body.notes,
        expectedAt: body.expectedAt ? new Date(body.expectedAt) : null,
        items: { create: items },
      },
      include: { items: true, supplier: true },
    });

    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "CREATE", entityType: "purchase_order", entityId: order.id, summary: `Created ${orderNumber}` });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
