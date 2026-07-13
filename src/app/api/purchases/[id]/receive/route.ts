import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePaidSession } from "@/lib/auth";
import { createStockMovement } from "@/services/inventory.service";
import { writeAuditLog } from "@/services/audit.service";
import { Decimal } from "@prisma/client/runtime/library";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidSession();
    const { id } = await ctx.params;
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, businessId: session.businessId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status === "RECEIVED") return NextResponse.json({ error: "Already received" }, { status: 400 });

    for (const item of order.items) {
      const qty = Number(item.quantityOrdered) - Number(item.quantityReceived);
      if (qty <= 0) continue;
      await createStockMovement({
        businessId: session.businessId,
        productId: item.productId,
        type: "PURCHASE",
        quantityDelta: qty,
        unitCostCents: item.unitCostCents,
        reference: order.orderNumber,
        actorUserId: session.userId,
      });
      await prisma.purchaseItem.update({
        where: { id: item.id },
        data: { quantityReceived: new Decimal(Number(item.quantityOrdered)) },
      });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: { items: true, supplier: true },
    });

    await prisma.notification.create({
      data: {
        businessId: session.businessId,
        type: "PURCHASE_RECEIVED",
        title: "Purchase received",
        message: `${order.orderNumber} has been received into stock`,
        link: `/purchases/${order.id}`,
      },
    });

    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "UPDATE", entityType: "purchase_order", entityId: id, summary: `Received ${order.orderNumber}` });
    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Receive failed" }, { status: 500 });
  }
}
