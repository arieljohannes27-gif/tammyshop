"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader, Card, Badge, Skeleton, Button, StatCard } from "@/components/ui";
import { RevenueChart } from "@/components/charts";
import { formatCents } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: async () => (await fetch("/api/analytics")).json() });
  if (isLoading || !data) return <Skeleton className="h-96" />;

  if (data.locked) {
    return (
      <div>
        <PageHeader title="AI Inventory Analysis" description="Upgrade to Advanced to unlock forecasts and stock intelligence." />
        <Card elevated className="text-center py-16">
          <p className="text-lg font-semibold">Advanced feature</p>
          <p className="mt-2 text-sm text-text-secondary">Fast movers, dead stock, turnover, demand and stockout predictions.</p>
          <Link href="/settings/billing"><Button className="mt-6">Upgrade to Advanced</Button></Link>
        </Card>
      </div>
    );
  }

  const groups = data.groups;
  return (
    <div>
      <PageHeader title="AI Inventory Analysis" description="Automatic detection of fast, slow and dead stock with reorder insights." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Fast moving" value={String(groups.fast.length)} tone="accent" />
        <StatCard label="Slow moving" value={String(groups.slow.length)} tone="warning" />
        <StatCard label="Dead stock" value={String(groups.dead.length)} tone="danger" />
        <StatCard label="Avg turnover" value={Number(data.turnover).toFixed(2)} tone="primary" />
      </div>
      <div className="mt-6"><RevenueChart data={data.chart} /></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {(["reorder","overstocked","fast","dead"] as const).map((key) => (
          <Card elevated key={key}>
            <p className="label-caps mb-3">{key.replace("_"," ")}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups[key].slice(0, 12).map((i: any) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.name}</span>
                  <Badge tone="primary">{i.daysOfStock != null ? `${i.daysOfStock.toFixed(0)}d` : `${i.soldQty} sold`}</Badge>
                </div>
              ))}
              {!groups[key].length ? <p className="text-xs text-text-muted">None</p> : null}
            </div>
          </Card>
        ))}
      </div>
      <Card elevated className="mt-6">
        <p className="label-caps mb-3">Demand & profit signals</p>
        <p className="text-sm text-text-secondary">Monthly sales {formatCents(data.kpis.monthlySalesCents)} · Profit {formatCents(data.kpis.profitCents)} · Expected stockouts flagged under Reorder.</p>
      </Card>
    </div>
  );
}
