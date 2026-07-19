import { NextResponse } from "next/server";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { receivePurchaseOrder } from "@/services/purchasing.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidPermission("purchases");
    const { id } = await ctx.params;
    const order = await receivePurchaseOrder({
      businessId: session.businessId,
      userId: session.userId,
      purchaseOrderId: id,
    });
    return NextResponse.json({ order });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "ALREADY_RECEIVED") {
      return NextResponse.json({ error: "Already received" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Receive failed" }, { status: 500 });
  }
}
