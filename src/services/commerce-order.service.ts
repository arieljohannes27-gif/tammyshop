import { prisma } from "@/lib/prisma";
import { createStockMovementInTx } from "@/services/inventory.service";
import { writeAuditLog } from "@/services/audit.service";
import { emitDomainEvent } from "@/services/events";
import { resolveCouponDiscount } from "@/services/pricing.service";
import { createHash } from "crypto";

export type CommerceCheckoutLine = {
  productId: string;
  quantity: number;
};

export type CommerceCheckoutInput = {
  businessId: string;
  userId?: string;
  items: CommerceCheckoutLine[];
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string | null;
  couponCode?: string;
  notes?: string;
  idempotencyKey?: string;
  /** Hash of request body for idempotency conflict detection */
  requestFingerprint?: string;
};

function fingerprintPayload(input: Omit<CommerceCheckoutInput, "requestFingerprint" | "userId">) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        items: input.items,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerId: input.customerId,
        couponCode: input.couponCode,
        notes: input.notes,
      }),
    )
    .digest("hex");
}

export async function createOnlineOrder(input: CommerceCheckoutInput) {
  const fp = input.requestFingerprint || fingerprintPayload(input);

  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: {
        businessId_idempotencyKey: {
          businessId: input.businessId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { items: true },
    });
    if (existing) {
      const prev = (existing.metadata as { fingerprint?: string } | null)?.fingerprint;
      if (prev && prev !== fp) throw new Error("IDEMPOTENCY_CONFLICT");
      return { order: existing, replayed: true as const };
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        id: { in: input.items.map((i) => i.productId) },
        businessId: input.businessId,
        deletedAt: null,
        isActive: true,
        isArchived: false,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lineItems = input.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new Error("PRODUCT_NOT_FOUND");
      if (Number(p.quantity) < i.quantity) throw new Error("INSUFFICIENT_STOCK");
      const line = p.sellPriceCents * i.quantity;
      subtotal += line;
      return {
        productId: i.productId,
        productName: p.name,
        quantity: i.quantity,
        unitPriceCents: p.sellPriceCents,
        discountCents: 0,
        totalCents: Math.round(line),
      };
    });

    let discountCents = 0;
    if (input.couponCode?.trim()) {
      const resolved = await resolveCouponDiscount({
        businessId: input.businessId,
        code: input.couponCode,
        subtotalCents: Math.round(subtotal),
      });
      if (resolved) {
        discountCents = resolved.discountCents;
        await tx.coupon.update({
          where: { id: resolved.coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const total = Math.max(0, Math.round(subtotal - discountCents));

    const business = await tx.business.update({
      where: { id: input.businessId },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    });
    const orderNumber = `ORD-${String(business.nextOrderNumber).padStart(6, "0")}`;

    const created = await tx.order.create({
      data: {
        businessId: input.businessId,
        customerId: input.customerId || null,
        channel: "ONLINE",
        status: "CONFIRMED",
        orderNumber,
        idempotencyKey: input.idempotencyKey || null,
        subtotalCents: Math.round(subtotal),
        discountCents,
        taxCents: 0,
        totalCents: total,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        notes: input.notes,
        confirmedAt: new Date(),
        metadata: { fingerprint: fp },
        items: { create: lineItems },
      },
      include: { items: true },
    });

    for (const item of lineItems) {
      await createStockMovementInTx(tx, {
        businessId: input.businessId,
        productId: item.productId,
        type: "SALE",
        quantityDelta: -item.quantity,
        unitCostCents: byId.get(item.productId)?.costPriceCents,
        reference: created.orderNumber,
        actorUserId: input.userId,
        notes: "Commerce API online order",
      });
    }

    if (input.customerId) {
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalSpentCents: { increment: total },
          loyaltyPoints: { increment: Math.floor(total / 1000) },
        },
      });
    }

    await writeAuditLog({
      businessId: input.businessId,
      userId: input.userId,
      action: "SALE",
      entityType: "order",
      entityId: created.id,
      summary: `Online order ${created.orderNumber} · R${(total / 100).toFixed(2)}`,
    });

    return created;
  });

  await emitDomainEvent({
    type: "order.created",
    businessId: input.businessId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    userId: input.userId,
  });

  return { order, replayed: false as const };
}

export async function getOrder(businessId: string, id: string) {
  return prisma.order.findFirst({
    where: { id, businessId },
    include: { items: true, customer: true },
  });
}

export async function listOrders(params: {
  businessId: string;
  limit?: number;
  status?: string;
}) {
  return prisma.order.findMany({
    where: {
      businessId: params.businessId,
      ...(params.status ? { status: params.status as never } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: Math.min(params.limit ?? 50, 100),
  });
}

export function serializeOrder(order: {
  id: string;
  orderNumber: string;
  status: string;
  channel: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currencyCode: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: { toString(): string } | number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }[];
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    channel: order.channel,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currencyCode: order.currencyCode,
    customer: {
      email: order.customerEmail,
      name: order.customerName,
      phone: order.customerPhone,
    },
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() ?? null,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: Number(i.quantity),
      unitPriceCents: i.unitPriceCents,
      discountCents: i.discountCents,
      totalCents: i.totalCents,
    })),
  };
}
