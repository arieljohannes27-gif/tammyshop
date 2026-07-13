"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { PageHeader, Button, Card, Select, Input, Label, Badge } from "@/components/ui";

export default function StockMovementsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ productId: "", type: "STOCK_IN", quantity: "1", notes: "", fromLocation: "", toLocation: "" });
  const { data, refetch } = useQuery({ queryKey: ["movements"], queryFn: async () => (await fetch("/api/stock-movements")).json() });

  useEffect(() => { fetch("/api/products").then(r => r.json()).then(d => setProducts(d.products || [])); }, []);

  async function submit() {
    const res = await fetch("/api/stock-movements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Movement recorded");
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Stock movements"
        description="Stock in, out, returns, damaged, transfers and adjustments — every move is audited."
        actions={
          <Link href="/inventory/scan-stock">
            <Button>
              <Camera className="h-4 w-4" /> Scan with phone
            </Button>
          </Link>
        }
      />
      <Card elevated className="mb-4 grid gap-3 md:grid-cols-3">
        <div><Label>Product</Label><Select className="mt-1" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}>
          <option value="">Select</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select></div>
        <div><Label>Type</Label><Select className="mt-1" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          {["STOCK_IN","STOCK_OUT","RETURN","DAMAGED","TRANSFER","ADJUSTMENT"].map(t => <option key={t} value={t}>{t}</option>)}
        </Select></div>
        <div><Label>Quantity</Label><Input className="mt-1" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
        <div><Label>From</Label><Input className="mt-1" value={form.fromLocation} onChange={e => setForm({ ...form, fromLocation: e.target.value })} /></div>
        <div><Label>To</Label><Input className="mt-1" value={form.toLocation} onChange={e => setForm({ ...form, toLocation: e.target.value })} /></div>
        <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="md:col-span-3"><Button onClick={submit}>Record movement</Button></div>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-bg/80 dark:bg-white/5"><tr>
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Qty</th>
            <th className="px-4 py-3 text-left">After</th>
            <th className="px-4 py-3 text-left">When</th>
          </tr></thead>
          <tbody>
            {(data?.movements || []).map((m: any) => (
              <tr key={m.id} className="border-t border-border/60">
                <td className="px-4 py-3">{m.product?.name}</td>
                <td className="px-4 py-3"><Badge>{m.type}</Badge></td>
                <td className="px-4 py-3">{m.quantity}</td>
                <td className="px-4 py-3">{m.quantityAfter}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
