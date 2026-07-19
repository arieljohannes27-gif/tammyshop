import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceErrorResponse, requireCommerceAuth } from "@/lib/commerce-auth";
import { createOnlineOrder, serializeOrder } from "@/services/commerce-order.service";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerId: z.string().uuid().optional().nullable(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

/** POST /api/v1/checkout — idempotent online order (Idempotency-Key header) */
export async function POST(req: Request) {
  try {
    const actor = await requireCommerceAuth(req, "orders:write");
    const body = schema.parse(await req.json());
    const idempotencyKey = req.headers.get("idempotency-key") || undefined;

    const result = await createOnlineOrder({
      businessId: actor.businessId,
      userId: actor.userId,
      items: body.items,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerId: body.customerId,
      couponCode: body.couponCode,
      notes: body.notes,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        order: serializeOrder(result.order),
        replayed: result.replayed,
      },
      { status: result.replayed ? 200 : 201 },
    );
  } catch (e) {
    const mapped = commerceErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }
    if (e instanceof Error && e.message.startsWith("COUPON_")) {
      return NextResponse.json({ error: e.message.replace(/_/g, " ").toLowerCase() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
