import { prisma } from "@/lib/prisma";

/** Shared pricing helpers for POS and future Commerce API / storefront. */

export function marginPercent(costCents: number, sellCents: number) {
  if (sellCents <= 0) return 0;
  return ((sellCents - costCents) / sellCents) * 100;
}

export function markupPercent(costCents: number, sellCents: number) {
  if (costCents <= 0) return 0;
  return ((sellCents - costCents) / costCents) * 100;
}

export async function getProductPrices(businessId: string, productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId, deletedAt: null },
    select: { id: true, sellPriceCents: true, costPriceCents: true, name: true, quantity: true },
  });
  return new Map(products.map((p) => [p.id, p]));
}

export async function resolveCouponDiscount(params: {
  businessId: string;
  code: string;
  subtotalCents: number;
}) {
  const code = params.code.trim();
  if (!code) return null;

  const coupon = await prisma.coupon.findFirst({
    where: {
      businessId: params.businessId,
      code: { equals: code, mode: "insensitive" },
      isActive: true,
    },
  });
  if (!coupon) throw new Error("COUPON_INVALID");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("COUPON_EXPIRED");
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) throw new Error("COUPON_EXHAUSTED");
  if (coupon.minPurchaseCents != null && params.subtotalCents < coupon.minPurchaseCents) {
    throw new Error("COUPON_MIN_PURCHASE");
  }

  let discountCents = 0;
  if (coupon.discountPercent != null) {
    discountCents += Math.round(params.subtotalCents * (Number(coupon.discountPercent) / 100));
  }
  if (coupon.discountCents != null) {
    discountCents += coupon.discountCents;
  }

  return { coupon, discountCents, code: coupon.code };
}
