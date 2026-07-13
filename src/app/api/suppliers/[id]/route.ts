import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requireSession();
  const { id } = await ctx.params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, businessId: session.businessId, deletedAt: null },
    include: { purchaseOrders: { orderBy: { createdAt: "desc" }, take: 20 }, products: { take: 20 } },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ supplier });
}
