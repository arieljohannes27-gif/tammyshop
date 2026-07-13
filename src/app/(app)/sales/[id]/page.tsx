"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Card, Badge, Button, Skeleton } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sale", id],
    queryFn: async () => {
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function refund() {
    const res = await fetch(`/api/sales/${id}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Refunded");
    refetch();
  }

  if (isLoading || !data?.sale) return <Skeleton className="h-80" />;
  const s = data.sale;
  return (
    <div>
      <PageHeader title={s.invoiceNumber} description={`${s.paymentMethod} · ${s.cashier?.fullName || "Cashier"}`}
        actions={s.status === "COMPLETED" ? <Button variant="danger" onClick={refund}>Refund / Return</Button> : undefined} />
      <div className="grid gap-4 md:grid-cols-4">
        <Card elevated><p className="label-caps">Total</p><p className="mt-2 text-2xl font-bold">{formatCents(s.totalCents)}</p></Card>
        <Card elevated><p className="label-caps">Profit</p><p className="mt-2 text-2xl font-bold">{formatCents(s.profitCents)}</p></Card>
        <Card elevated><p className="label-caps">Discount</p><p className="mt-2 text-2xl font-bold">{formatCents(s.discountCents)}</p></Card>
        <Card elevated><p className="label-caps">Status</p><div className="mt-2"><Badge tone={s.status === "COMPLETED" ? "success" : "warning"}>{s.status}</Badge></div></Card>
      </div>
      <Card elevated className="mt-4">
        <p className="label-caps mb-3">Line items</p>
        <div className="space-y-2">
          {s.items.map((i: any) => (
            <div key={i.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
              <span>{i.productName} × {Number(i.quantity)}</span>
              <span className="font-medium">{formatCents(i.totalCents)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
