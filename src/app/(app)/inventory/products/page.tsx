"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Download, Upload, Search, Camera } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, Badge, EmptyState, Skeleton } from "@/components/ui";
import { formatCents, calcMarkup } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  quantity: number;
  minStock: number;
  costPriceCents: number;
  sellPriceCents: number;
  location?: string | null;
  category?: { name: string } | null;
  brand?: { name: string } | null;
};

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["products", q],
    queryFn: async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const products: Product[] = data?.products ?? [];

  const stats = useMemo(() => {
    const low = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
    const out = products.filter((p) => p.quantity <= 0).length;
    return { low, out, total: products.length };
  }, [products]);

  async function onImport(file: File) {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return toast.error("CSV is empty");
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = line.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return {
        name: obj.name,
        sku: obj.sku,
        barcode: obj.barcode,
        cost: obj.cost,
        sell: obj.sell,
        quantity: obj.quantity,
        minStock: obj.minstock || obj.min_stock,
        location: obj.location,
      };
    });
    const res = await fetch("/api/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Import failed");
    toast.success(`Imported ${json.created} products`);
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage inventory, barcodes, pricing and stock levels."
        actions={
          <>
            <Link href="/inventory/scan-stock">
              <Button>
                <Camera className="h-4 w-4" /> Scan stock in
              </Button>
            </Link>
            <Link href="/inventory/categories">
              <Button variant="secondary">Categories</Button>
            </Link>
            <Link href="/inventory/brands">
              <Button variant="secondary">Brands</Button>
            </Link>
            <a href="/api/products/export?format=csv">
              <Button variant="secondary">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </a>
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
              />
              <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text dark:bg-surface">
                <Upload className="h-4 w-4" /> Import CSV
              </span>
            </label>
            <Link href="/inventory/products/new">
              <Button>
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Badge tone="primary">{stats.total} products</Badge>
        <Badge tone="warning">{stats.low} low stock</Badge>
        <Badge tone="danger">{stats.out} out of stock</Badge>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input className="pl-9" placeholder="Search name, SKU, barcode..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product or import a CSV to get started."
          action={
            <Link href="/inventory/products/new">
              <Button>Add product</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-bg/80 text-text-secondary dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Cost</th>
                  <th className="px-4 py-3 font-semibold">Sell</th>
                  <th className="px-4 py-3 font-semibold">Markup</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const status =
                    p.quantity <= 0 ? "Out" : p.quantity <= p.minStock ? "Low" : "OK";
                  return (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-bg/50 dark:hover:bg-white/5">
                      <td className="px-4 py-3">
                        <Link href={`/inventory/products/${p.id}`} className="font-medium text-primary hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-text-muted">
                          {[p.category?.name, p.brand?.name].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.sku || "—"}</td>
                      <td className="px-4 py-3 font-semibold">{p.quantity}</td>
                      <td className="px-4 py-3">{formatCents(p.costPriceCents)}</td>
                      <td className="px-4 py-3">{formatCents(p.sellPriceCents)}</td>
                      <td className="px-4 py-3">{calcMarkup(p.costPriceCents, p.sellPriceCents).toFixed(0)}%</td>
                      <td className="px-4 py-3">
                        <Badge tone={status === "OK" ? "success" : status === "Low" ? "warning" : "danger"}>
                          {status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
