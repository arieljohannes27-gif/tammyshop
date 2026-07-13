import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession();
  const categories = await prisma.category.findMany({
    where: { businessId: session.businessId, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = z.object({ name: z.string().min(1), description: z.string().optional(), color: z.string().optional() }).parse(await req.json());
  const category = await prisma.category.create({ data: { businessId: session.businessId, ...body } });
  return NextResponse.json({ category }, { status: 201 });
}
