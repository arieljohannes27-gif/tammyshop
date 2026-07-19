import { prisma } from "@/lib/prisma";
import { createStockMovementInTx } from "@/services/inventory.service";
import { writeAuditLog } from "@/services/audit.service";

export type SaleLineInput = {
  productId: string;
  quantity: number;
  /** Ignored for pricing — server uses Product.sellPriceCents */
  unitPriceCents?: number;
  /** Ignored for costing — server uses Product.costPriceCents */
  costPriceCents?: number;
  discountCents?: number;
};

export type CreateSaleInput = {
  businessId: string;
  userId: string;
  items: SaleLineInput[];
  paymentMethod: "CASH" | "CARD" | "EFT" | "SPLIT" | "OTHER";
  discountPercent?: number;
  discountCents?: number;
  customerId?: string | null;
  couponCode?: string;
  cashReceivedCents?: number;
  splitDetails?: unknown;
  receiptEmail?: string;
  notes?: string;
};

export async function createSale(input: CreateSaleInput) {
  const discountPercent = input.discountPercent ?? 0;
  const discountCents = input.discountCents ?? 0;

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        id: { in: input.items.map((i) => i.productId) },
        businessId: input.businessId,
        deletedAt: null,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let cost = 0;
    const lineItems = input.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new Error("PRODUCT_NOT_FOUND");
      const unitPriceCents = p.sellPriceCents;
      const costPriceCents = p.costPriceCents;
      const lineDiscount = i.discountCents ?? 0;
      const line = unitPriceCents * i.quantity - lineDiscount;
      const lineCost = costPriceCents * i.quantity;
      subtotal += line;
      cost += lineCost;
      return {
        productId: i.productId,
        productName: p.name,
        quantity: i.quantity,
        unitPriceCents,
        costPriceCents,
        discountCents: lineDiscount,
        taxCents: 0,
        totalCents: Math.round(line),
        profitCents: Math.round(line - lineCost),
      };
    });

    let couponDiscount = 0;
    let couponCode: string | null = null;
    if (input.couponCode?.trim()) {
      const code = input.couponCode.trim().toUpperCase();
      const coupon = await tx.coupon.findFirst({
        where: {
          businessId: input.businessId,
          code: { equals: code, mode: "insensitive" },
          isActive: true,
        },
      });
      if (!coupon) throw new Error("COUPON_INVALID");
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("COUPON_EXPIRED");
      if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) throw new Error("COUPON_EXHAUSTED");
      if (coupon.minPurchaseCents != null && subtotal < coupon.minPurchaseCents) {
        throw new Error("COUPON_MIN_PURCHASE");
      }
      if (coupon.discountPercent != null) {
        couponDiscount += Math.round(subtotal * (Number(coupon.discountPercent) / 100));
      }
      if (coupon.discountCents != null) {
        couponDiscount += coupon.discountCents;
      }
      couponCode = coupon.code;
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const pctDiscount = Math.round(subtotal * (discountPercent / 100));
    const totalDiscount = discountCents + pctDiscount + couponDiscount;
    const total = Math.max(0, Math.round(subtotal - totalDiscount));
    const profit = total - cost;

    const business = await tx.business.update({
      where: { id: input.businessId },
      data: { nextInvoiceNumber: { increment: 1 } },
      select: { nextInvoiceNumber: true },
    });
    const invoiceNumber = `INV-${String(business.nextInvoiceNumber).padStart(6, "0")}`;

    const sale = await tx.sale.create({
      data: {
        businessId: input.businessId,
        customerId: input.customerId || null,
        cashierId: input.userId,
        invoiceNumber,
        paymentMethod: input.paymentMethod,
        subtotalCents: Math.round(subtotal),
        discountCents: totalDiscount,
        discountPercent,
        taxCents: 0,
        totalCents: total,
        costCents: Math.round(cost),
        profitCents: Math.round(profit),
        cashReceivedCents: input.cashReceivedCents,
        changeCents:
          input.cashReceivedCents != null ? input.cashReceivedCents - total : null,
        splitDetails: input.splitDetails as object | undefined,
        couponCode,
        receiptEmail: input.receiptEmail,
        notes: input.notes,
        items: { create: lineItems },
        payments: {
          create:
            input.paymentMethod === "SPLIT" && Array.isArray(input.splitDetails)
              ? (
                  input.splitDetails as {
                    method: "CASH" | "CARD" | "EFT";
                    amountCents: number;
                  }[]
                ).map((p) => ({
                  method: p.method,
                  amountCents: p.amountCents,
                }))
              : [{ method: input.paymentMethod, amountCents: total }],
        },
      },
      include: { items: true, payments: true },
    });

    if (input.customerId) {
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalSpentCents: { increment: total },
          loyaltyPoints: { increment: Math.floor(total / 1000) },
        },
      });
    }

    for (const item of lineItems) {
      await createStockMovementInTx(tx, {
        businessId: input.businessId,
        productId: item.productId,
        type: "SALE",
        quantityDelta: -Number(item.quantity),
        unitCostCents: item.costPriceCents,
        reference: sale.invoiceNumber,
        actorUserId: input.userId,
      });
    }

    await writeAuditLog({
      businessId: input.businessId,
      userId: input.userId,
      action: "SALE",
      entityType: "sale",
      entityId: sale.id,
      summary: `Sale ${sale.invoiceNumber} · R${(total / 100).toFixed(2)}`,
    });

    const settings = await tx.businessSetting.findUnique({
      where: { businessId: input.businessId },
    });
    if (settings && total >= settings.largeSaleThresholdCents) {
      await tx.notification.create({
        data: {
          businessId: input.businessId,
          type: "LARGE_SALE",
          title: "Large sale recorded",
          message: `${sale.invoiceNumber} for R${(total / 100).toFixed(2)}`,
          link: `/sales/${sale.id}`,
        },
      });
    }

    return sale;
  });
}

export async function refundSale(params: {
  businessId: string;
  userId: string;
  saleId: string;
  full?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: params.saleId, businessId: params.businessId },
      include: { items: true },
    });
    if (!sale) throw new Error("NOT_FOUND");
    if (sale.status === "REFUNDED") throw new Error("ALREADY_REFUNDED");

    for (const item of sale.items) {
      await createStockMovementInTx(tx, {
        businessId: params.businessId,
        productId: item.productId,
        type: "RETURN",
        quantityDelta: Number(item.quantity),
        unitCostCents: item.costPriceCents,
        reference: `REFUND-${sale.invoiceNumber}`,
        actorUserId: params.userId,
      });
    }

    const updated = await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: "REFUNDED",
        refundedCents: sale.totalCents,
      },
    });

    if (sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: {
          totalSpentCents: { decrement: sale.totalCents },
        },
      });
    }

    await writeAuditLog({
      businessId: params.businessId,
      userId: params.userId,
      action: "REFUND",
      entityType: "sale",
      entityId: sale.id,
      summary: `Refunded ${sale.invoiceNumber}`,
      metadata: { full: params.full ?? true },
    });

    return updated;
  });
}
