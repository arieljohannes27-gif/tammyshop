import { NextResponse } from "next/server";
import { z } from "zod";
import { createOnlineOrder, serializeOrder } from "@/services/commerce-order.service";
import { getStorefrontBusiness } from "@/lib/storefront";
import { commerceErrorResponse } from "@/lib/commerce-auth";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerName: z.string().max(120).optional(),
  customerPhone: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
});

/** Public Lekka storefront checkout — binds to configured storefront business. */
export async function POST(req: Request) {
  try {
    const business = await getStorefrontBusiness();
    const body = schema.parse(await req.json());
    const idempotencyKey = req.headers.get("idempotency-key") || undefined;

    const result = await createOnlineOrder({
      businessId: business.id,
      items: body.items,
      customerEmail: body.customerEmail || undefined,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      notes: body.notes,
      idempotencyKey,
    });

    return NextResponse.json(
      { order: serializeOrder(result.order), replayed: result.replayed },
      { status: result.replayed ? 200 : 201 },
    );
  } catch (e) {
    const mapped = commerceErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message || "Invalid request" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "STOREFRONT_BUSINESS_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Storefront not configured" }, { status: 503 });
    }
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }
    if (e instanceof Error && e.message.startsWith("COUPON_")) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }
    console.error("[storefront.checkout]", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
