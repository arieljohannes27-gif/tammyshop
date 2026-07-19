import { NextResponse } from "next/server";
import { commerceErrorResponse, requireCommerceAuth } from "@/lib/commerce-auth";
import { getOrder, serializeOrder } from "@/services/commerce-order.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const actor = await requireCommerceAuth(req, "orders:read");
    const { id } = await ctx.params;
    const order = await getOrder(actor.businessId, id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order: serializeOrder(order) });
  } catch (e) {
    const mapped = commerceErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
