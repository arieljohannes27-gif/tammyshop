import { prisma } from "@/lib/prisma";
import type { Prisma, StockMovementType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { writeAuditLog } from "@/services/audit.service";

type DbClient = Prisma.TransactionClient | typeof prisma;

async function applyStockMovement(
  tx: DbClient,
  params: {
    businessId: string;
    productId: string;
    type: StockMovementType;
    quantityDelta: number;
    unitCostCents?: number;
    reference?: string;
    notes?: string;
    fromLocation?: string;
    toLocation?: string;
    actorUserId?: string;
  },
) {
  const product = await tx.product.findFirst({
    where: { id: params.productId, businessId: params.businessId, deletedAt: null },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const current = Number(product.quantity);
  const next = current + params.quantityDelta;
  if (next < 0) {
    const settings = await tx.businessSetting.findUnique({ where: { businessId: params.businessId } });
    if (!settings?.allowNegativeStock) throw new Error("INSUFFICIENT_STOCK");
  }

  const updated = await tx.product.update({
    where: { id: product.id },
    data: { quantity: new Decimal(next) },
  });

  const movement = await tx.stockMovement.create({
    data: {
      businessId: params.businessId,
      productId: product.id,
      type: params.type,
      quantity: new Decimal(params.quantityDelta),
      quantityAfter: new Decimal(next),
      unitCostCents: params.unitCostCents ?? product.costPriceCents,
      reference: params.reference,
      notes: params.notes,
      fromLocation: params.fromLocation,
      toLocation: params.toLocation,
      actorUserId: params.actorUserId,
    },
  });

  await writeAuditLog({
    businessId: params.businessId,
    userId: params.actorUserId,
    action: "STOCK_MOVEMENT",
    entityType: "product",
    entityId: product.id,
    summary: `${params.type}: ${product.name} (${params.quantityDelta > 0 ? "+" : ""}${params.quantityDelta})`,
    metadata: { movementId: movement.id, quantityAfter: next },
  });

  if (Number(updated.quantity) <= 0) {
    await tx.notification.create({
      data: {
        businessId: params.businessId,
        type: "OUT_OF_STOCK",
        title: "Out of stock",
        message: `${product.name} is out of stock`,
        link: `/inventory/products/${product.id}`,
      },
    });
  } else if (Number(updated.quantity) <= Number(product.minStock)) {
    await tx.notification.create({
      data: {
        businessId: params.businessId,
        type: "LOW_STOCK",
        title: "Low stock",
        message: `${product.name} is below minimum stock (${updated.quantity})`,
        link: `/inventory/products/${product.id}`,
      },
    });
  }

  return { product: updated, movement };
}

/** Standalone stock movement (own transaction). */
export async function createStockMovement(params: {
  businessId: string;
  productId: string;
  type: StockMovementType;
  quantityDelta: number;
  unitCostCents?: number;
  reference?: string;
  notes?: string;
  fromLocation?: string;
  toLocation?: string;
  actorUserId?: string;
}) {
  return prisma.$transaction((tx) => applyStockMovement(tx, params));
}

/** Stock movement inside an existing transaction (atomic with sales/refunds). */
export async function createStockMovementInTx(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    productId: string;
    type: StockMovementType;
    quantityDelta: number;
    unitCostCents?: number;
    reference?: string;
    notes?: string;
    fromLocation?: string;
    toLocation?: string;
    actorUserId?: string;
  },
) {
  return applyStockMovement(tx, params);
}
