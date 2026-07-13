import { NextResponse } from "next/server";
import { getBusinessPlan, requireSession } from "@/lib/auth";
import { generateShoppingList } from "@/services/analytics.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const lists = await prisma.shoppingList.findMany({
      where: { businessId: session.businessId },
      include: { items: true },
      orderBy: { generatedAt: "desc" },
      take: 10,
    });
    return NextResponse.json({ lists });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    const plan = await getBusinessPlan(session.businessId);
    if (!plan.aiShoppingList) {
      return NextResponse.json({ error: "AI Shopping List requires Advanced plan" }, { status: 402 });
    }
    const list = await generateShoppingList(session.businessId);
    return NextResponse.json({ list }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}
