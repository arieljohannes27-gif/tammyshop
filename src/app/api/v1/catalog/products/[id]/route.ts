import { NextResponse } from "next/server";
import { commerceErrorResponse, requireCommerceAuth } from "@/lib/commerce-auth";
import { getProduct } from "@/services/catalog.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const actor = await requireCommerceAuth(req, "catalog:read");
    const { id } = await ctx.params;
    const product = await getProduct(actor.businessId, id);
    if (!product || !product.isActive || product.isArchived) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        imageUrl: product.imageUrl,
        sellPriceCents: product.sellPriceCents,
        currencyCode: "ZAR",
        quantityAvailable: Number(product.quantity),
        category: product.category ? { id: product.category.id, name: product.category.name } : null,
        brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
      },
    });
  } catch (e) {
    const mapped = commerceErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
