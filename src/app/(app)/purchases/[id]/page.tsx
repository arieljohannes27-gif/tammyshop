"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Card, Badge, Button, Skeleton } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["purchase", id], queryFn: async () => (await fetch(`/api/purchases/${id}`)).json() });

  async function receive() {
    const res = await fetch(`/api/purchases/${id}/receive`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Stock received");
    refetch();
  }

  if (isLoading || !data?.order) return <Skeleton className="h-80" />;
  const o = data.order;
  return (
    <div>
      <PageHeader title={o.orderNumber} description={o.supplier?.name}
        actions={o.status !== "RECEIVED" ? <Button onClick={receive}>Receive stock</Button> : undefined} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card elevated><p className="label-caps">Status</p><div className="mt-2"><Badge tone={o.status === "RECEIVED" ? "success" : "warning"}>{o.status}</Badge></div></Card>
        <Card elevated><p className="label-caps">Total</p><p className="mt-2 text-2xl font-bold">{formatCents(o.totalCents)}</p></Card>
        <Card elevated><p className="label-caps">Expected</p><p className="mt-2 text-sm">{o.expectedAt ? new Date(o.expectedAt).toLocaleDateString() : "—"}</p></Card>
      </div>
      <Card elevated className="mt-4">
        <p className="label-caps mb-3">Items</p>
        {o.items.map((i: any) => (
          <div key={i.id} className="flex justify-between border-b border-border/50 py-2 text-sm">
            <span>{i.productName}</span>
            <span>Ordered {Number(i.quantityOrdered)} · Received {Number(i.quantityReceived)}</span>
            <span>{formatCents(i.totalCents)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
