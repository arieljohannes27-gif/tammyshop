"use client";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Badge } from "@/components/ui";

const REPORTS = [
  { type: "sales", label: "Sales Report" },
  { type: "inventory", label: "Inventory Report" },
  { type: "suppliers", label: "Supplier Report" },
  { type: "customers", label: "Customer Report" },
  { type: "profit", label: "Profit Report" },
  { type: "purchases", label: "Purchase Report" },
  { type: "tax", label: "Tax Report" },
  { type: "low", label: "Low Stock Report" },
  { type: "fast", label: "Fast Moving Report" },
  { type: "slow", label: "Slow Moving Report" },
  { type: "dead", label: "Dead Stock Report" },
];

export default function ReportsPage() {
  const [active, setActive] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function load(type: string) {
    setLoading(true); setActive(type);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setPayload(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setPayload(null);
    } finally { setLoading(false); }
  }

  function exportJson() {
    if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tammyshop-${active}-report.json`; a.click();
  }

  function exportCsv() {
    if (!payload) return;
    const rows = payload.sales || payload.products || payload.customers || payload.suppliers || payload.orders || payload.items || [];
    if (!rows.length) return toast.error("Nothing to export");
    const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== "object");
    const csv = [keys.join(","), ...rows.map((r: any) => keys.map(k => `"${String(r[k] ?? "").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tammyshop-${active}.csv`; a.click();
  }

  return (
    <div>
      <PageHeader title="Reports" description="Sales, inventory, profit, tax and stock intelligence — export PDF/Excel/CSV." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(r => (
          <button key={r.type} onClick={() => load(r.type)}>
            <Card elevated className={`text-left transition hover:border-primary/40 ${active===r.type ? "ring-2 ring-primary/30" : ""}`}>
              <p className="font-semibold">{r.label}</p>
              <p className="mt-1 text-xs text-text-muted">Click to generate</p>
            </Card>
          </button>
        ))}
      </div>
      {active ? (
        <Card elevated className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{active}</Badge>
            <Button variant="secondary" size="sm" onClick={exportCsv}>Export CSV / Excel</Button>
            <Button variant="secondary" size="sm" onClick={exportJson}>Export JSON</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>Print / PDF</Button>
          </div>
          {loading ? <p className="text-sm">Loading...</p> : (
            <pre className="max-h-[480px] overflow-auto rounded-xl bg-bg p-4 text-xs dark:bg-black/30">{JSON.stringify(payload, null, 2)}</pre>
          )}
        </Card>
      ) : null}
    </div>
  );
}
