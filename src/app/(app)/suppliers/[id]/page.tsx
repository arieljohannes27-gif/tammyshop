"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Card, Badge, Skeleton } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["supplier", id], queryFn: async () => (await fetch(`/api/suppliers/${id}`)).json() });
  if (isLoading || !data?.supplier) return <Skeleton className="h-80" />;
  const s = data.supplier;
  return (
    <div>
      <PageHeader title={s.name} description={[s.contactName, s.phone, s.email].filter(Boolean).join(" · ")} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card elevated><p className="label-caps">Outstanding</p><p className="mt-2 text-2xl font-bold">{formatCents(s.outstandingBalanceCents)}</p></Card>
        <Card elevated><p className="label-caps">Lead time</p><p className="mt-2 text-2xl font-bold">{s.leadTimeDays} days</p></Card>
        <Card elevated><p className="label-caps">Orders</p><p className="mt-2 text-2xl font-bold">{s.purchaseOrders?.length || 0}</p></Card>
      </div>
      <Card elevated className="mt-4">
        <p className="label-caps mb-3">Purchase history</p>
        {(s.purchaseOrders || []).map((o: any) => (
          <div key={o.id} className="flex justify-between border-b border-border/50 py-2 text-sm">
            <span>{o.orderNumber}</span>
            <Badge>{o.status}</Badge>
            <span>{formatCents(o.totalCents)}</span>
          </div>
        ))}
        {s.notes ? <p className="mt-4 text-sm text-text-secondary">{s.notes}</p> : null}
      </Card>
    </div>
  );
}
