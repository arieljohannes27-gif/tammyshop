"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Button, Card, Badge, Skeleton } from "@/components/ui";
import { formatCents, calcMarkup, calcProfit, calcGrossMargin } from "@/lib/utils";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading || !data?.product) return <Skeleton className="h-96" />;
  const p = data.product;
  const markup = calcMarkup(p.costPriceCents, p.sellPriceCents);
  const profit = calcProfit(p.costPriceCents, p.sellPriceCents);
  const margin = calcGrossMargin(p.costPriceCents, p.sellPriceCents);

  async function duplicate() {
    const res = await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duplicate: true }) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Duplicated");
    router.push(`/inventory/products/${json.product.id}`);
  }

  async function archive() {
    const res = await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isArchived: true, isActive: false }) });
    if (!res.ok) return toast.error("Failed");
    toast.success("Archived");
    refetch();
  }

  return (
    <div>
      <PageHeader
        title={p.name}
        description={[p.sku, p.barcode, p.category?.name].filter(Boolean).join(" · ")}
        actions={
          <>
            <Button variant="secondary" onClick={duplicate}>Duplicate</Button>
            <Button variant="danger" onClick={archive}>Archive</Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card elevated><p className="label-caps">Quantity</p><p className="mt-2 text-3xl font-bold">{p.quantity}</p></Card>
        <Card elevated><p className="label-caps">Cost</p><p className="mt-2 text-3xl font-bold">{formatCents(p.costPriceCents)}</p></Card>
        <Card elevated><p className="label-caps">Sell</p><p className="mt-2 text-3xl font-bold">{formatCents(p.sellPriceCents)}</p></Card>
        <Card elevated><p className="label-caps">Profit / unit</p><p className="mt-2 text-3xl font-bold">{formatCents(profit)}</p><p className="text-xs text-text-secondary">Markup {markup.toFixed(0)}% · Margin {margin.toFixed(0)}%</p></Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card elevated>
          <p className="label-caps mb-3">Details</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-text-secondary">Brand</dt><dd>{p.brand?.name || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Supplier</dt><dd>{p.supplier?.name || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Location</dt><dd>{p.location || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Batch</dt><dd>{p.batchNumber || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Min / Max</dt><dd>{p.minStock} / {p.maxStock ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">VAT</dt><dd>{p.vatInclusive ? "Inclusive" : "Exclusive"}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Status</dt><dd><Badge tone={p.isArchived ? "warning" : "success"}>{p.isArchived ? "Archived" : "Active"}</Badge></dd></div>
          </dl>
          {p.notes ? <p className="mt-4 text-sm text-text-secondary">{p.notes}</p> : null}
        </Card>
        <Card elevated>
          <p className="label-caps mb-3">Stock movements</p>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {(p.stockMovements || []).map((m: { id: string; type: string; quantity: number; quantityAfter: number; createdAt: string }) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-sm dark:bg-white/5">
                <div>
                  <p className="font-medium">{m.type}</p>
                  <p className="text-xs text-text-muted">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={m.quantity >= 0 ? "text-success" : "text-danger"}>{m.quantity >= 0 ? "+" : ""}{m.quantity}</p>
                  <p className="text-xs text-text-muted">after {m.quantityAfter}</p>
                </div>
              </div>
            ))}
            {!p.stockMovements?.length ? <p className="text-sm text-text-secondary">No movements yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
