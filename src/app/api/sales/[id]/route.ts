import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePaidSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidSession();
    const { id } = await ctx.params;
    const sale = await prisma.sale.findFirst({
      where: { id, businessId: session.businessId },
      include: { items: true, payments: true, customer: true, cashier: true },
    });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sale });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
