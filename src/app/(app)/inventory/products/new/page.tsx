"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { parseRandToCents } from "@/lib/utils";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", sku: "", barcode: "", categoryId: "", brandId: "", supplierId: "",
    cost: "", sell: "", quantity: "0", minStock: "5", maxStock: "", location: "", batchNumber: "", notes: "", expiryDate: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/brands").then(r => r.json()),
      fetch("/api/suppliers").then(r => r.json()),
    ]).then(([c, b, s]) => {
      setCategories(c.categories || []);
      setBrands(b.brands || []);
      setSuppliers(s.suppliers || []);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          sku: form.sku || undefined,
          barcode: form.barcode || undefined,
          categoryId: form.categoryId || null,
          brandId: form.brandId || null,
          supplierId: form.supplierId || null,
          costPriceCents: parseRandToCents(form.cost),
          sellPriceCents: parseRandToCents(form.sell),
          quantity: Number(form.quantity || 0),
          minStock: Number(form.minStock || 5),
          maxStock: form.maxStock ? Number(form.maxStock) : null,
          location: form.location || undefined,
          batchNumber: form.batchNumber || undefined,
          notes: form.notes || undefined,
          expiryDate: form.expiryDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Product created");
      router.push(`/inventory/products/${data.product.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add product" description="Create a product with pricing, stock and identifiers." />
      <Card elevated>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Name</Label><Input className="mt-1.5" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>SKU</Label><Input className="mt-1.5" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto if empty" /></div>
          <div><Label>Barcode</Label><Input className="mt-1.5" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
          <div><Label>Category</Label><Select className="mt-1.5" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label>Brand</Label><Select className="mt-1.5" value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })}><option value="">None</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
          <div><Label>Supplier</Label><Select className="mt-1.5" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}><option value="">None</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
          <div><Label>Location</Label><Input className="mt-1.5" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>Buying price (R)</Label><Input className="mt-1.5" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required /></div>
          <div><Label>Selling price (R)</Label><Input className="mt-1.5" value={form.sell} onChange={e => setForm({ ...form, sell: e.target.value })} required /></div>
          <div><Label>Quantity</Label><Input type="number" className="mt-1.5" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><Label>Min stock</Label><Input type="number" className="mt-1.5" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} /></div>
          <div><Label>Max stock</Label><Input type="number" className="mt-1.5" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: e.target.value })} /></div>
          <div><Label>Batch number</Label><Input className="mt-1.5" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} /></div>
          <div><Label>Expiry date</Label><Input type="date" className="mt-1.5" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Notes</Label><Textarea className="mt-1.5" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="md:col-span-2"><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create product"}</Button></div>
        </form>
      </Card>
    </div>
  );
}
