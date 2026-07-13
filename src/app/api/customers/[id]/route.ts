import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requireSession();
  const { id } = await ctx.params;
  const customer = await prisma.customer.findFirst({
    where: { id, businessId: session.businessId, deletedAt: null },
    include: { sales: { orderBy: { createdAt: "desc" }, take: 30, include: { items: true } } },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ customer });
}
