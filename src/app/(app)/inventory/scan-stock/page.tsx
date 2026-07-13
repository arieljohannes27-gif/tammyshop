"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Camera, PackagePlus, CheckCircle2 } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PageHeader, Button, Card, Input, Label, Badge } from "@/components/ui";
import { formatCents, parseRandToCents } from "@/lib/utils";

type FoundProduct = {
  id: string;
  name: string;
  barcode?: string | null;
  quantity: number;
  costPriceCents: number;
  sellPriceCents: number;
};

type ScanResult =
  | { kind: "found"; barcode: string; product: FoundProduct }
  | { kind: "missing"; barcode: string };

export default function ScanStockPage() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qty, setQty] = useState("1");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ name: string; qty: number; after: number } | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    cost: "",
    sell: "",
  });

  const onScan = useCallback(async (barcode: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/scan/stock-in?barcode=${encodeURIComponent(barcode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");

      // Always close camera once we have a code so the confirm form is visible
      setScannerOpen(false);

      if (!data.found) {
        setResult({ kind: "missing", barcode: data.barcode || barcode });
        setNewProduct({
          name: "",
          cost: "",
          sell: "",
        });
        setQty("1");
        toast.message("New barcode — enter the product name, then add stock");
        return;
      }

      setResult({ kind: "found", barcode: data.barcode || barcode, product: data.product });
      setQty("1");
      toast.success(`Found ${data.product.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
      // Keep scanner open so they can try again / type digits
    } finally {
      setBusy(false);
    }
  }, []);

  async function confirmStockIn(createIfMissing = false) {
    if (!result) return;
    const quantity = Number(qty);
    if (!quantity || quantity <= 0) return toast.error("Enter a valid quantity");

    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        barcode: result.barcode,
        quantity,
        createIfMissing,
      };

      if (createIfMissing && result.kind === "missing") {
        if (!newProduct.name.trim()) throw new Error("Enter a product name");
        payload.name = newProduct.name.trim();
        payload.costPriceCents = parseRandToCents(newProduct.cost);
        payload.sellPriceCents = parseRandToCents(newProduct.sell);
      }

      const res = await fetch("/api/scan/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add stock");

      setLastAdded({
        name: data.product.name,
        qty: quantity,
        after: data.product.quantity,
      });
      toast.success(`+${quantity} ${data.product.name}`);
      setResult(null);
      setScannerOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Scan stock in"
        description="Phone camera barcode scan — works for Nestlé sachets and other grocery barcodes."
        actions={
          <Link href="/inventory/products">
            <Button variant="secondary">Products</Button>
          </Link>
        }
      />

      <Card elevated className="mb-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Camera className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Phone barcode scanner</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Nestlé Hot Chocolate sachets are often not in your catalogue yet. After a successful scan you
          can name the product, set buy/sell price, and add stock in one step.
        </p>
        <ul className="mt-3 space-y-1 text-left text-xs text-text-muted">
          <li>• Flatten the sachet so the barcode is flat</li>
          <li>• Use bright light (or tap Light in the scanner)</li>
          <li>• If camera struggles, type the numbers printed under the bars</li>
        </ul>
        <Button className="mt-5 w-full" size="lg" onClick={() => setScannerOpen(true)} disabled={busy}>
          <Camera className="h-5 w-5" /> Open camera scanner
        </Button>
      </Card>

      {lastAdded ? (
        <Card className="mb-4 border-success/30 bg-success/5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">Stock added</p>
              <p className="text-sm text-text-secondary">
                +{lastAdded.qty} {lastAdded.name} · now {lastAdded.after} on hand
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {result?.kind === "found" ? (
        <Card elevated className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-caps">Matched product</p>
              <h3 className="mt-1 text-lg font-bold">{result.product.name}</h3>
              <p className="text-sm text-text-secondary">Barcode {result.barcode}</p>
            </div>
            <Badge tone="success">In catalogue</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-bg p-3 dark:bg-white/5">
              <p className="text-text-muted">On hand</p>
              <p className="text-xl font-bold">{result.product.quantity}</p>
            </div>
            <div className="rounded-xl bg-bg p-3 dark:bg-white/5">
              <p className="text-text-muted">Sell price</p>
              <p className="text-xl font-bold">{formatCents(result.product.sellPriceCents)}</p>
            </div>
          </div>
          <div>
            <Label>Quantity to add</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => confirmStockIn(false)}>
              <PackagePlus className="h-4 w-4" />
              {busy ? "Adding..." : "Add stock"}
            </Button>
            <Button variant="secondary" onClick={() => setScannerOpen(true)}>
              Scan again
            </Button>
          </div>
        </Card>
      ) : null}

      {result?.kind === "missing" ? (
        <Card elevated className="space-y-4 border-warning/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-caps">New product barcode</p>
              <h3 className="mt-1 break-all text-lg font-bold tracking-wide">{result.barcode}</h3>
              <p className="mt-1 text-sm text-text-secondary">
                This Nestlé / grocery barcode is not in TammyShop yet. Save it now and add stock.
              </p>
            </div>
            <Badge tone="warning">New</Badge>
          </div>
          <div>
            <Label>Product name</Label>
            <Input
              className="mt-1.5"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Nestlé Hot Chocolate Sachet"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Buying price (R)</Label>
              <Input
                className="mt-1.5"
                value={newProduct.cost}
                onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                placeholder="e.g. 8.50"
              />
            </div>
            <div>
              <Label>Selling price (R)</Label>
              <Input
                className="mt-1.5"
                value={newProduct.sell}
                onChange={(e) => setNewProduct({ ...newProduct, sell: e.target.value })}
                placeholder="e.g. 12.00"
              />
            </div>
          </div>
          <div>
            <Label>Quantity to add</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => confirmStockIn(true)}>
              {busy ? "Saving..." : "Create & add stock"}
            </Button>
            <Button variant="secondary" onClick={() => setScannerOpen(true)}>
              Scan again
            </Button>
          </div>
        </Card>
      ) : null}

      {scannerOpen ? (
        <BarcodeScanner
          mode="in"
          title="ADD STOCK"
          onClose={() => setScannerOpen(false)}
          onScan={onScan}
        />
      ) : null}
    </div>
  );
}
