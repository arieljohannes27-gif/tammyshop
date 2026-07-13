import { prisma } from "@/lib/prisma";
import type { DashboardKpis, ChartPoint, ProductAnalyticsItem, ActivityItem } from "@/types";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";

function toNum(v: { toNumber?: () => number } | number | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  if (typeof v.toNumber === "function") return v.toNumber();
  return Number(v) || 0;
}

export async function getDashboardKpis(businessId: string): Promise<DashboardKpis> {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const products = await prisma.product.findMany({
    where: { businessId, deletedAt: null, isArchived: false },
    select: {
      id: true,
      quantity: true,
      costPriceCents: true,
      sellPriceCents: true,
      minStock: true,
    },
  });

  let inventoryValueCents = 0;
  let totalStockValueCents = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    const qty = toNum(p.quantity);
    inventoryValueCents += Math.round(qty * p.costPriceCents);
    totalStockValueCents += Math.round(qty * p.sellPriceCents);
    if (qty <= 0) outOfStockCount += 1;
    else if (qty <= toNum(p.minStock)) lowStockCount += 1;
  }

  const [todaySalesAgg, monthlySalesAgg, pendingOrders, purchasesCount] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId, status: "COMPLETED", createdAt: { gte: today } },
      _sum: { totalCents: true, profitCents: true },
    }),
    prisma.sale.aggregate({
      where: { businessId, status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { totalCents: true, profitCents: true, costCents: true },
    }),
    prisma.purchaseOrder.count({
      where: { businessId, status: { in: ["SENT", "PARTIAL", "DRAFT"] } },
    }),
    prisma.purchaseOrder.count({
      where: { businessId, createdAt: { gte: monthStart } },
    }),
  ]);

  const todaySalesCents = todaySalesAgg._sum.totalCents ?? 0;
  const monthlySalesCents = monthlySalesAgg._sum.totalCents ?? 0;
  const profitCents = monthlySalesAgg._sum.profitCents ?? 0;
  const costCents = monthlySalesAgg._sum.costCents ?? 0;
  const grossMarginPercent =
    monthlySalesCents > 0 ? ((monthlySalesCents - costCents) / monthlySalesCents) * 100 : 0;

  const stockHealth =
    products.length === 0
      ? 100
      : Math.max(0, 100 - (lowStockCount / products.length) * 40 - (outOfStockCount / products.length) * 60);
  const salesHealth = monthlySalesCents > 0 ? Math.min(100, 50 + profitCents / Math.max(monthlySalesCents, 1) * 100) : 40;
  const inventoryHealthScore = Math.round(stockHealth);
  const businessHealthScore = Math.round(stockHealth * 0.5 + salesHealth * 0.5);

  return {
    totalStockValueCents,
    todaySalesCents,
    monthlySalesCents,
    profitCents,
    grossMarginPercent,
    inventoryValueCents,
    productCount: products.length,
    lowStockCount,
    outOfStockCount,
    ordersPending: pendingOrders,
    purchasesCount,
    inventoryHealthScore,
    businessHealthScore,
  };
}

export async function getSalesChart(businessId: string, days = 30): Promise<ChartPoint[]> {
  const start = startOfDay(subDays(new Date(), days - 1));
  const sales = await prisma.sale.findMany({
    where: { businessId, status: "COMPLETED", createdAt: { gte: start } },
    select: { createdAt: true, totalCents: true, profitCents: true },
  });

  const map = new Map<string, { value: number; secondary: number }>();
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), days - 1 - i), "dd MMM");
    map.set(d, { value: 0, secondary: 0 });
  }
  for (const s of sales) {
    const key = format(s.createdAt, "dd MMM");
    const cur = map.get(key) || { value: 0, secondary: 0 };
    cur.value += s.totalCents / 100;
    cur.secondary += s.profitCents / 100;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([label, v]) => ({
    label,
    value: Math.round(v.value * 100) / 100,
    secondary: Math.round(v.secondary * 100) / 100,
  }));
}

export async function getCategoryBreakdown(businessId: string) {
  const products = await prisma.product.findMany({
    where: { businessId, deletedAt: null, isArchived: false },
    include: { category: true },
  });
  const map = new Map<string, number>();
  for (const p of products) {
    const name = p.category?.name ?? "Uncategorized";
    const value = toNum(p.quantity) * p.sellPriceCents;
    map.set(name, (map.get(name) ?? 0) + value);
  }
  return Array.from(map.entries())
    .map(([name, valueCents]) => ({ name, value: valueCents / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export async function getProductAnalytics(businessId: string): Promise<ProductAnalyticsItem[]> {
  const since = subDays(new Date(), 30);
  const products = await prisma.product.findMany({
    where: { businessId, deletedAt: null, isArchived: false },
    include: {
      saleItems: {
        where: { sale: { createdAt: { gte: since }, status: "COMPLETED" } },
      },
    },
  });

  return products.map((p) => {
    const soldQty = p.saleItems.reduce((sum, i) => sum + toNum(i.quantity), 0);
    const revenueCents = p.saleItems.reduce((sum, i) => sum + i.totalCents, 0);
    const profitCents = p.saleItems.reduce((sum, i) => sum + i.profitCents, 0);
    const qty = toNum(p.quantity);
    const avgDaily = soldQty / 30;
    const daysOfStock = avgDaily > 0 ? qty / avgDaily : null;
    const turnover = qty > 0 ? soldQty / qty : soldQty > 0 ? 999 : 0;
    const minStock = toNum(p.minStock);
    const maxStock = p.maxStock != null ? toNum(p.maxStock) : null;

    let status: ProductAnalyticsItem["status"] = "healthy";
    if (soldQty === 0 && qty > 0) status = "dead";
    else if (avgDaily >= 1 || turnover >= 2) status = "fast";
    else if (soldQty > 0 && avgDaily < 0.15) status = "slow";
    if (qty <= minStock && qty > 0) status = "reorder";
    if (maxStock != null && qty > maxStock) status = "overstocked";
    if (qty <= 0 && soldQty > 0) status = "reorder";

    return {
      id: p.id,
      name: p.name,
      quantity: qty,
      soldQty,
      revenueCents,
      profitCents,
      turnover,
      daysOfStock,
      status,
    };
  });
}

export async function getRecentActivity(businessId: string, limit = 15): Promise<ActivityItem[]> {
  const logs = await prisma.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return logs.map((l) => ({
    id: l.id,
    type: l.action,
    title: l.summary,
    description: `${l.entityType}${l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}`,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function generateShoppingList(businessId: string) {
  const analytics = await getProductAnalytics(businessId);
  const products = await prisma.product.findMany({
    where: { businessId, deletedAt: null, isArchived: false, isActive: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = analytics
    .filter((a) => a.status === "reorder" || a.status === "fast" || (a.daysOfStock != null && a.daysOfStock < 5))
    .map((a) => {
      const p = byId.get(a.id)!;
      const min = toNum(p.minStock);
      const qty = toNum(p.quantity);
      const target = p.maxStock != null ? toNum(p.maxStock) : Math.max(min * 3, min + a.soldQty);
      const need = Math.max(0, Math.ceil(target - qty));
      return {
        productId: p.id,
        productName: p.name,
        quantity: need,
        unitCostCents: p.costPriceCents,
        totalCents: need * p.costPriceCents,
        reason:
          a.status === "reorder"
            ? "Below minimum stock"
            : a.status === "fast"
              ? "Fast moving — restock soon"
              : "Low days of stock",
      };
    })
    .filter((i) => i.quantity > 0);

  const estimatedCents = items.reduce((s, i) => s + i.totalCents, 0);
  const list = await prisma.shoppingList.create({
    data: {
      businessId,
      name: `Shopping List ${format(new Date(), "dd MMM yyyy")}`,
      estimatedCents,
      items: { create: items },
    },
    include: { items: true },
  });
  return list;
}
