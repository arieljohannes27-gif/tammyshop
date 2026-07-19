import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Resolve the Lekka Stop Shop tenant from env (ID preferred, else slug). */
export const getStorefrontBusiness = cache(async () => {
  const id = process.env.STOREFRONT_BUSINESS_ID?.trim();
  const slug = process.env.STOREFRONT_BUSINESS_SLUG?.trim() || "lekkerstopshop";

  const business = id
    ? await prisma.business.findFirst({ where: { id, deletedAt: null } })
    : await prisma.business.findFirst({ where: { slug, deletedAt: null } });

  if (!business) {
    throw new Error("STOREFRONT_BUSINESS_NOT_CONFIGURED");
  }

  return business;
});

export function storefrontBrandName() {
  return process.env.NEXT_PUBLIC_STOREFRONT_NAME?.trim() || "Lekka Stop Shop";
}

export function storefrontLocation() {
  return process.env.NEXT_PUBLIC_STOREFRONT_LOCATION?.trim() || "Westridge";
}
