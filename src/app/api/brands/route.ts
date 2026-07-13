import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession();
  const brands = await prisma.brand.findMany({
    where: { businessId: session.businessId, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = z.object({ name: z.string().min(1) }).parse(await req.json());
  const brand = await prisma.brand.create({ data: { businessId: session.businessId, name: body.name } });
  return NextResponse.json({ brand }, { status: 201 });
}
