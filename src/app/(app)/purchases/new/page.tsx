"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader, Button, Card, Select, Input, Label } from "@/components/ui";
import { parseRandToCents } from "@/lib/utils";

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState([{ productId: "", quantityOrdered: "1", unitCost: "" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/suppliers").then(r => r.json()), fetch("/api/products").then(r => r.json())]).then(([s, p]) => {
      setSuppliers(s.suppliers || []); setProducts(p.products || []);
    });
  }, []);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: lines.filter(l => l.productId).map(l => ({
            productId: l.productId,
            quantityOrdered: Number(l.quantityOrdered),
            unitCostCents: parseRandToCents(l.unitCost),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Purchase order created");
      router.push(`/purchases/${json.order.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="New purchase order" />
      <Card elevated className="space-y-4">
        <div><Label>Supplier</Label>
          <Select className="mt-1" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">Select supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        {lines.map((l, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-3">
            <Select value={l.productId} onChange={e => { const n=[...lines]; n[idx]={...n[idx], productId:e.target.value}; setLines(n); }}>
              <option value="">Product</option>
              {products.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Input type="number" placeholder="Qty" value={l.quantityOrdered} onChange={e => { const n=[...lines]; n[idx]={...n[idx], quantityOrdered:e.target.value}; setLines(n); }} />
            <Input placeholder="Unit cost R" value={l.unitCost} onChange={e => { const n=[...lines]; n[idx]={...n[idx], unitCost:e.target.value}; setLines(n); }} />
          </div>
        ))}
        <Button variant="secondary" onClick={() => setLines([...lines, { productId: "", quantityOrdered: "1", unitCost: "" }])}>Add line</Button>
        <Button onClick={submit} disabled={loading || !supplierId}>{loading ? "Saving..." : "Create order"}</Button>
      </Card>
    </div>
  );
}
