"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Wallet,
  Activity,
  CircleDollarSign,
} from "lucide-react";
import { PageHeader, StatCard, Card, Badge, Skeleton } from "@/components/ui";
import { RevenueChart, CategoryPieChart, SalesBarChart, InventoryTrendChart } from "@/components/charts";
import { formatCents } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your shop at a glance — stock, sales, profit and health."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <StatCard label="Total Stock Value" value={formatCents(kpis.totalStockValueCents)} icon={<Wallet className="h-5 w-5" />} tone="primary" />
        </motion.div>
        <StatCard label="Today's Sales" value={formatCents(kpis.todaySalesCents)} icon={<ShoppingBag className="h-5 w-5" />} tone="accent" />
        <StatCard label="Monthly Sales" value={formatCents(kpis.monthlySalesCents)} icon={<TrendingUp className="h-5 w-5" />} tone="success" />
        <StatCard label="Profit" value={formatCents(kpis.profitCents)} hint={`Gross margin ${kpis.grossMarginPercent.toFixed(1)}%`} icon={<CircleDollarSign className="h-5 w-5" />} tone="success" />
        <StatCard label="Inventory Value" value={formatCents(kpis.inventoryValueCents)} icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Products" value={String(kpis.productCount)} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Low Stock" value={String(kpis.lowStockCount)} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
        <StatCard label="Out of Stock" value={String(kpis.outOfStockCount)} hint={`${kpis.ordersPending} orders pending`} icon={<Activity className="h-5 w-5" />} tone="danger" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card elevated className="flex flex-col justify-center">
          <p className="label-caps">Inventory Health Score</p>
          <p className="mt-2 text-5xl font-extrabold text-primary">{kpis.inventoryHealthScore}</p>
          <p className="mt-2 text-sm text-text-secondary">Based on low / out-of-stock ratios</p>
        </Card>
        <Card elevated className="flex flex-col justify-center">
          <p className="label-caps">Business Health Score</p>
          <p className="mt-2 text-5xl font-extrabold text-accent">{kpis.businessHealthScore}</p>
          <p className="mt-2 text-sm text-text-secondary">Stock health + monthly profit mix</p>
        </Card>
        <Card elevated>
          <p className="label-caps mb-3">Purchases this month</p>
          <p className="text-4xl font-bold">{kpis.purchasesCount}</p>
          <p className="mt-2 text-sm text-text-secondary">Orders pending: {kpis.ordersPending}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <RevenueChart data={data.salesChart} />
        <SalesBarChart data={data.salesChart} />
        <InventoryTrendChart data={data.inventoryTrend} />
        <CategoryPieChart data={data.categories} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <ProductList title="Fastest Moving" items={data.fastest} tone="accent" />
        <ProductList title="Slowest Moving" items={data.slowest} tone="warning" />
        <ProductList title="Best Selling" items={data.bestSelling} tone="primary" />
        <ProductList title="Most Profitable" items={data.mostProfitable} tone="success" profit />
      </div>

      <Card elevated className="mt-6">
        <p className="label-caps mb-4">Recent Activity</p>
        <div className="space-y-3">
          {data.activity?.length ? (
            data.activity.map((a: { id: string; title: string; description: string; createdAt: string; type: string }) => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-text-muted">{a.description}</p>
                </div>
                <div className="text-right">
                  <Badge>{a.type}</Badge>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-secondary">No recent activity yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ProductList({
  title,
  items,
  tone,
  profit,
}: {
  title: string;
  items: { id: string; name: string; soldQty: number; profitCents: number }[];
  tone: "primary" | "accent" | "warning" | "success";
  profit?: boolean;
}) {
  return (
    <Card elevated>
      <p className="label-caps mb-3">{title}</p>
      <div className="space-y-2">
        {items?.length ? (
          items.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm">
              <span className="truncate pr-2">{i.name}</span>
              <Badge tone={tone}>
                {profit ? formatCents(i.profitCents) : `${i.soldQty} sold`}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-xs text-text-muted">No data yet</p>
        )}
      </div>
    </Card>
  );
}
