import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireOwnerOrManager } from "@/lib/auth";
import { businessHasPaidAccess, businessIsApproved } from "@/lib/subscription";
import { refundSale } from "@/services/sales.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await requireOwnerOrManager();
    if (!(await businessIsApproved(session.businessId))) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }
    if (!(await businessHasPaidAccess(session.businessId))) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const { id } = await ctx.params;
    const body = z.object({ full: z.boolean().default(true) }).parse(await req.json().catch(() => ({})));

    const sale = await refundSale({
      businessId: session.businessId,
      userId: session.userId,
      saleId: id,
      full: body.full,
    });

    return NextResponse.json({ sale });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "ALREADY_REFUNDED") {
      return NextResponse.json({ error: "Already refunded" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Stock update failed" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
