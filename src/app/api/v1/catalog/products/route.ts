import { NextResponse } from "next/server";
import { commerceErrorResponse, requireCommerceAuth } from "@/lib/commerce-auth";
import { listProducts } from "@/services/catalog.service";

/** GET /api/v1/catalog/products — public catalog for storefront */
export async function GET(req: Request) {
  try {
    const actor = await requireCommerceAuth(req, "catalog:read");
    const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
    const products = await listProducts({
      businessId: actor.businessId,
      q,
      includeArchived: false,
    });

    return NextResponse.json({
      products: products
        .filter((p) => p.isActive)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          sku: p.sku,
          barcode: p.barcode,
          imageUrl: p.imageUrl,
          sellPriceCents: p.sellPriceCents,
          currencyCode: "ZAR",
          quantityAvailable: Number(p.quantity),
          category: p.category ? { id: p.category.id, name: p.category.name } : null,
          brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
        })),
    });
  } catch (e) {
    const mapped = commerceErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
