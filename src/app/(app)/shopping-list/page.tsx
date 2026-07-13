"use client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Button, Card, EmptyState, Badge } from "@/components/ui";
import { formatCents } from "@/lib/utils";
import Link from "next/link";

export default function ShoppingListPage() {
  const { data, refetch } = useQuery({ queryKey: ["shopping-lists"], queryFn: async () => (await fetch("/api/shopping-list")).json() });

  async function generate() {
    const res = await fetch("/api/shopping-list", { method: "POST" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Advanced plan required");
    toast.success("Shopping list generated");
    refetch();
  }

  function printList(list: any) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${list.name}</title></head><body style="font-family:sans-serif;padding:24px">
      <h1>${list.name}</h1><p>Estimated: ${formatCents(list.estimatedCents)}</p><ul>
      ${list.items.map((i:any) => `<li>BUY ${Number(i.quantity)} ${i.productName}</li>`).join("")}
      </ul><script>window.print()</script></body></html>`);
    w.document.close();
  }

  const latest = data?.lists?.[0];

  return (
    <div>
      <PageHeader title="AI Shopping List" description="Auto-generated BUY lists from inventory intelligence."
        actions={<Button onClick={generate}>Generate list</Button>} />
      {!latest ? (
        <EmptyState title="No shopping lists yet" description="Advanced subscribers can generate printable shopping lists." action={<><Button onClick={generate}>Generate</Button><Link href="/settings/billing" className="ml-2 text-sm text-primary">Upgrade</Link></>} />
      ) : (
        <Card elevated>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{latest.name}</h2>
              <p className="text-sm text-text-secondary">Estimated purchase value {formatCents(latest.estimatedCents)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => printList(latest)}>Print / PDF</Button>
              <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(latest.items.map((i:any)=>`BUY ${Number(i.quantity)} ${i.productName}`).join("\n")); toast.success("Copied — ready to share/email"); }}>Share / Email</Button>
            </div>
          </div>
          <div className="space-y-2">
            {latest.items.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl bg-bg px-4 py-3 dark:bg-white/5">
                <div>
                  <p className="font-medium">BUY {Number(i.quantity)} {i.productName}</p>
                  <p className="text-xs text-text-muted">{i.reason}</p>
                </div>
                <Badge tone="primary">{formatCents(i.totalCents)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
