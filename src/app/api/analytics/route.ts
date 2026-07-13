import { NextResponse } from "next/server";
import { getBusinessPlan, requirePaidSession } from "@/lib/auth";
import { getProductAnalytics, getSalesChart, getDashboardKpis } from "@/services/analytics.service";

export async function GET() {
  try {
    const session = await requirePaidSession();
    const plan = await getBusinessPlan(session.businessId);
    const [analytics, chart, kpis] = await Promise.all([
      getProductAnalytics(session.businessId),
      getSalesChart(session.businessId, 30),
      getDashboardKpis(session.businessId),
    ]);

    const groups = {
      fast: analytics.filter((a) => a.status === "fast"),
      slow: analytics.filter((a) => a.status === "slow"),
      dead: analytics.filter((a) => a.status === "dead"),
      reorder: analytics.filter((a) => a.status === "reorder"),
      overstocked: analytics.filter((a) => a.status === "overstocked"),
    };

    return NextResponse.json({
      plan: plan.plan,
      locked: !plan.stockMovementAnalysis,
      analytics,
      groups,
      chart,
      kpis,
      turnover:
        analytics.length === 0
          ? 0
          : analytics.reduce((s, a) => s + a.turnover, 0) / analytics.length,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
