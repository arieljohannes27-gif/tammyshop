"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Card, Skeleton } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ["customer", id], queryFn: async () => (await fetch(`/api/customers/${id}`)).json() });
  if (isLoading || !data?.customer) return <Skeleton className="h-80" />;
  const c = data.customer;
  return (
    <div>
      <PageHeader title={c.name} description={[c.phone, c.email, c.address].filter(Boolean).join(" · ")} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card elevated><p className="label-caps">Total spent</p><p className="mt-2 text-2xl font-bold">{formatCents(c.totalSpentCents)}</p></Card>
        <Card elevated><p className="label-caps">Loyalty points</p><p className="mt-2 text-2xl font-bold">{c.loyaltyPoints}</p></Card>
        <Card elevated><p className="label-caps">Purchases</p><p className="mt-2 text-2xl font-bold">{c.sales?.length || 0}</p></Card>
      </div>
      <Card elevated className="mt-4">
        <p className="label-caps mb-3">Purchase history</p>
        {(c.sales || []).map((s: any) => (
          <div key={s.id} className="flex justify-between border-b border-border/50 py-2 text-sm">
            <span>{s.invoiceNumber}</span>
            <span>{formatCents(s.totalCents)}</span>
            <span className="text-text-muted">{new Date(s.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
        {c.notes ? <p className="mt-4 text-sm text-text-secondary">{c.notes}</p> : null}
      </Card>
    </div>
  );
}
