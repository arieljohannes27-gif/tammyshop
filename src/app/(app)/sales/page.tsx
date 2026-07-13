"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2, Search, Printer, Mail } from "lucide-react";
import { PageHeader, Button, Card, Input, Badge, Select } from "@/components/ui";
import { usePosStore } from "@/stores/pos-store";
import { formatCents, parseRandToCents } from "@/lib/utils";
import type { PaymentMethod } from "@/types";
import Link from "next/link";

export default function SalesPosPage() {
  const [q, setQ] = useState("");
  const [barcode, setBarcode] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");
  const [receiptEmail, setReceiptEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; invoiceNumber: string; totalCents: number } | null>(null);

  const store = usePosStore();
  const { data, refetch } = useQuery({
    queryKey: ["products-pos", q],
    queryFn: async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      return res.json();
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-pos"],
    queryFn: async () => (await fetch("/api/customers")).json(),
  });

  const products = data?.products ?? [];
  const subtotal = store.subtotalCents();
  const total = store.totalCents();
  const change = store.cashReceivedCents - total;

  const filtered = useMemo(() => products.slice(0, 40), [products]);

  function addProduct(p: {
    id: string;
    name: string;
    sku?: string | null;
    barcode?: string | null;
    sellPriceCents: number;
    costPriceCents: number;
    quantity: number;
  }) {
    if (p.quantity <= 0) return toast.error("Out of stock");
    store.addItem({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      quantity: 1,
      unitPriceCents: p.sellPriceCents,
      costPriceCents: p.costPriceCents,
    });
  }

  function scanBarcode() {
    const p = products.find((x: { barcode?: string | null }) => x.barcode === barcode.trim());
    if (!p) return toast.error("Barcode not found");
    addProduct(p);
    setBarcode("");
  }

  async function checkout() {
    if (!store.items.length) return toast.error("Cart is empty");
    setBusy(true);
    try {
      const splitDetails =
        store.paymentMethod === "SPLIT"
          ? [
              { method: "CASH" as const, amountCents: parseRandToCents(splitCash) },
              { method: "CARD" as const, amountCents: parseRandToCents(splitCard) },
            ]
          : undefined;

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: store.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            costPriceCents: i.costPriceCents,
            discountCents: i.discountCents,
          })),
          paymentMethod: store.paymentMethod,
          discountPercent: store.discountPercent,
          discountCents: store.discountCents,
          customerId: store.customerId || null,
          couponCode: store.couponCode || undefined,
          cashReceivedCents: store.paymentMethod === "CASH" ? store.cashReceivedCents || total : undefined,
          splitDetails,
          receiptEmail: receiptEmail || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sale failed");
      setLastSale({ id: json.sale.id, invoiceNumber: json.sale.invoiceNumber, totalCents: json.sale.totalCents });
      toast.success(`Sale ${json.sale.invoiceNumber} completed`);
      store.clear();
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setBusy(false);
    }
  }

  function printReceipt() {
    if (!lastSale) return toast.error("Complete a sale first");
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt ${lastSale.invoiceNumber}</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>TammyShop</h2>
        <p>${lastSale.invoiceNumber}</p>
        <p>Total: ${formatCents(lastSale.totalCents)}</p>
        <p>Thank you for your purchase.</p>
        <script>window.print()</script>
      </body></html>
    `);
    w.document.close();
  }

  return (
    <div>
      <PageHeader
        title="Sales / POS"
        description="Search products, scan barcodes, apply discounts and take payment."
        actions={
          <Link href="/sales/history">
            <Button variant="secondary">Sales history</Button>
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card elevated className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input className="pl-9" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Input placeholder="Scan barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && scanBarcode()} />
              <Button variant="secondary" onClick={scanBarcode}>
                Add
              </Button>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: {
              id: string;
              name: string;
              sellPriceCents: number;
              costPriceCents: number;
              quantity: number;
              sku?: string | null;
              barcode?: string | null;
            }) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="rounded-2xl border border-border/70 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 dark:bg-surface"
              >
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-primary">{formatCents(p.sellPriceCents)}</p>
                <p className="mt-2 text-xs text-text-muted">Stock: {p.quantity}</p>
              </button>
            ))}
          </div>
        </div>

        <Card elevated className="h-fit sticky top-24">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-bold">Cart</p>
            <Badge tone="primary">{store.items.length} items</Badge>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto">
            {store.items.map((item) => (
              <div key={item.productId} className="rounded-xl bg-bg p-3 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-text-muted">{formatCents(item.unitPriceCents)}</p>
                  </div>
                  <button onClick={() => store.removeItem(item.productId)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => store.setQty(item.productId, item.quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button size="icon" variant="secondary" onClick={() => store.setQty(item.productId, item.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="ml-auto text-sm font-semibold">
                    {formatCents(item.unitPriceCents * item.quantity - item.discountCents)}
                  </span>
                </div>
              </div>
            ))}
            {!store.items.length ? <p className="text-sm text-text-secondary">Cart is empty</p> : null}
          </div>

          <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-xs text-text-secondary">Discount %</p>
                <Input
                  type="number"
                  value={store.discountPercent}
                  onChange={(e) => store.setDiscountPercent(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-text-secondary">Discount R</p>
                <Input
                  value={(store.discountCents / 100).toString()}
                  onChange={(e) => store.setDiscountCents(parseRandToCents(e.target.value))}
                />
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-text-secondary">Coupon</p>
              <Input value={store.couponCode} onChange={(e) => store.setCoupon(e.target.value)} placeholder="Code" />
            </div>
            <div>
              <p className="mb-1 text-xs text-text-secondary">Customer</p>
              <Select value={store.customerId || ""} onChange={(e) => store.setCustomerId(e.target.value || undefined)}>
                <option value="">Walk-in</option>
                {(customersData?.customers || []).map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs text-text-secondary">Payment</p>
              <Select
                value={store.paymentMethod}
                onChange={(e) => store.setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="EFT">EFT</option>
                <option value="SPLIT">Split</option>
              </Select>
            </div>
            {store.paymentMethod === "CASH" ? (
              <div>
                <p className="mb-1 text-xs text-text-secondary">Cash received</p>
                <Input
                  value={(store.cashReceivedCents / 100 || "").toString()}
                  onChange={(e) => store.setCashReceived(parseRandToCents(e.target.value))}
                />
                {store.cashReceivedCents > 0 ? (
                  <p className="mt-1 text-xs text-text-secondary">Change: {formatCents(Math.max(0, change))}</p>
                ) : null}
              </div>
            ) : null}
            {store.paymentMethod === "SPLIT" ? (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Cash R" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
                <Input placeholder="Card R" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} />
              </div>
            ) : null}
            <div>
              <p className="mb-1 text-xs text-text-secondary">Receipt email</p>
              <Input type="email" value={receiptEmail} onChange={(e) => setReceiptEmail(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(subtotal)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCents(total)}</span></div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button className="w-full" disabled={busy || !store.items.length} onClick={checkout}>
              {busy ? "Processing..." : "Complete sale"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={printReceipt}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!receiptEmail) return toast.error("Enter receipt email");
                  toast.success(`Receipt queued to ${receiptEmail}`);
                }}
              >
                <Mail className="h-4 w-4" /> Email
              </Button>
            </div>
            {lastSale ? (
              <Link href={`/sales/${lastSale.id}`} className="text-center text-sm text-primary hover:underline">
                View {lastSale.invoiceNumber}
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
