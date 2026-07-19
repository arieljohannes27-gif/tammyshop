import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { createStockMovementInTx } from "@/services/inventory.service";
import { writeAuditLog } from "@/services/audit.service";
import { emitDomainEvent } from "@/services/events";
import { createNotification } from "@/services/notification.service";

export async function receivePurchaseOrder(params: {
  businessId: string;
  userId: string;
  purchaseOrderId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findFirst({
      where: { id: params.purchaseOrderId, businessId: params.businessId },
      include: { items: true },
    });
    if (!order) throw new Error("NOT_FOUND");
    if (order.status === "RECEIVED") throw new Error("ALREADY_RECEIVED");

    for (const item of order.items) {
      const qty = Number(item.quantityOrdered) - Number(item.quantityReceived);
      if (qty <= 0) continue;

      await createStockMovementInTx(tx, {
        businessId: params.businessId,
        productId: item.productId,
        type: "PURCHASE",
        quantityDelta: qty,
        unitCostCents: item.unitCostCents,
        reference: order.orderNumber,
        actorUserId: params.userId,
      });

      await tx.purchaseItem.update({
        where: { id: item.id },
        data: { quantityReceived: new Decimal(Number(item.quantityOrdered)) },
      });
    }

    const updated = await tx.purchaseOrder.update({
      where: { id: order.id },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: { items: true, supplier: true },
    });

    await writeAuditLog({
      businessId: params.businessId,
      userId: params.userId,
      action: "UPDATE",
      entityType: "purchase_order",
      entityId: order.id,
      summary: `Received ${order.orderNumber}`,
    });

    return updated;
  }).then(async (updated) => {
    await createNotification({
      businessId: params.businessId,
      type: "PURCHASE_RECEIVED",
      title: "Purchase received",
      message: `${updated.orderNumber} has been received into stock`,
      link: `/purchases/${updated.id}`,
    });
    await emitDomainEvent({
      type: "purchase.received",
      businessId: params.businessId,
      purchaseOrderId: updated.id,
      orderNumber: updated.orderNumber,
      userId: params.userId,
    });
    return updated;
  });
}
