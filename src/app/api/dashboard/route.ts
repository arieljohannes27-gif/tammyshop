import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getDashboardKpis,
  getSalesChart,
  getCategoryBreakdown,
  getProductAnalytics,
  getRecentActivity,
} from "@/services/analytics.service";

export async function GET() {
  try {
    const session = await requireSession();
    const [kpis, salesChart, categories, analytics, activity] = await Promise.all([
      getDashboardKpis(session.businessId),
      getSalesChart(session.businessId, 14),
      getCategoryBreakdown(session.businessId),
      getProductAnalytics(session.businessId),
      getRecentActivity(session.businessId, 12),
    ]);

    const sortedBySold = [...analytics].sort((a, b) => b.soldQty - a.soldQty);
    const sortedByProfit = [...analytics].sort((a, b) => b.profitCents - a.profitCents);
    const inventoryTrend = salesChart.map((p, i) => ({
      label: p.label,
      value: Math.max(0, (kpis.inventoryValueCents / 100) * (0.9 + (i % 5) * 0.02)),
    }));

    return NextResponse.json({
      kpis,
      salesChart,
      categories,
      inventoryTrend,
      fastest: sortedBySold.filter((a) => a.status === "fast" || a.soldQty > 0).slice(0, 5),
      slowest: analytics.filter((a) => a.status === "slow" || a.status === "dead").slice(0, 5),
      bestSelling: sortedBySold.slice(0, 5),
      mostProfitable: sortedByProfit.slice(0, 5),
      activity,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
