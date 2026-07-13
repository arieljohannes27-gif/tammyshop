import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBusinessPlan, requireSession } from "@/lib/auth";
import { getProductAnalytics, getDashboardKpis } from "@/services/analytics.service";
import { startOfMonth, subMonths } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const plan = await getBusinessPlan(session.businessId);
    if (!plan.reports) return NextResponse.json({ error: "Reports require Starter or Advanced" }, { status: 402 });

    const type = new URL(req.url).searchParams.get("type") || "sales";
    const monthStart = startOfMonth(new Date());
    const prevStart = startOfMonth(subMonths(new Date(), 1));

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        where: { businessId: session.businessId, createdAt: { gte: monthStart }, status: "COMPLETED" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ type, sales });
    }

    if (type === "inventory") {
      const products = await prisma.product.findMany({
        where: { businessId: session.businessId, deletedAt: null, isArchived: false },
        include: { category: true },
      });
      return NextResponse.json({ type, products });
    }

    if (type === "profit") {
      const kpis = await getDashboardKpis(session.businessId);
      const sales = await prisma.sale.aggregate({
        where: { businessId: session.businessId, createdAt: { gte: prevStart }, status: "COMPLETED" },
        _sum: { profitCents: true, totalCents: true, costCents: true },
      });
      return NextResponse.json({ type, kpis, period: sales._sum });
    }

    if (type === "tax") {
      const sales = await prisma.sale.aggregate({
        where: { businessId: session.businessId, createdAt: { gte: monthStart }, status: "COMPLETED" },
        _sum: { totalCents: true, taxCents: true },
      });
      const business = await prisma.business.findUnique({ where: { id: session.businessId } });
      const vatRate = Number(business?.vatRate ?? 15);
      const total = sales._sum.totalCents ?? 0;
      const estimatedVat = Math.round(total - total / (1 + vatRate / 100));
      return NextResponse.json({ type, totalCents: total, taxCents: sales._sum.taxCents ?? estimatedVat, vatRate });
    }

    if (type === "suppliers") {
      const suppliers = await prisma.supplier.findMany({
        where: { businessId: session.businessId, deletedAt: null },
        include: { purchaseOrders: true },
      });
      return NextResponse.json({ type, suppliers });
    }

    if (type === "customers") {
      const customers = await prisma.customer.findMany({
        where: { businessId: session.businessId, deletedAt: null },
        orderBy: { totalSpentCents: "desc" },
      });
      return NextResponse.json({ type, customers });
    }

    if (type === "purchases") {
      const orders = await prisma.purchaseOrder.findMany({
        where: { businessId: session.businessId },
        include: { supplier: true, items: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ type, orders });
    }

    if (["fast", "slow", "dead", "low"].includes(type)) {
      const analytics = await getProductAnalytics(session.businessId);
      const map = {
        fast: analytics.filter((a) => a.status === "fast"),
        slow: analytics.filter((a) => a.status === "slow"),
        dead: analytics.filter((a) => a.status === "dead"),
        low: analytics.filter((a) => a.status === "reorder"),
      } as const;
      const key = type as keyof typeof map;
      return NextResponse.json({ type, items: map[key] });
    }

    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
