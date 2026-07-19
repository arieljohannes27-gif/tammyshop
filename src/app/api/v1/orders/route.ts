import { NextResponse } from "next/server";
import { commerceErrorResponse, requireCommerceAuth } from "@/lib/commerce-auth";
import { listOrders, serializeOrder } from "@/services/commerce-order.service";

export async function GET(req: Request) {
  try {
    const actor = await requireCommerceAuth(req, "orders:read");
    const { searchParams } = new URL(req.url);
    const orders = await listOrders({
      businessId: actor.businessId,
      limit: Number(searchParams.get("limit") || 50),
      status: searchParams.get("status") || undefined,
    });
    return NextResponse.json({ orders: orders.map(serializeOrder) });
  } catch (e) {
    const mapped = commerceErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
