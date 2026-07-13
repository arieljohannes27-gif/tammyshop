"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Button, Card, Badge, EmptyState } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function PurchasesPage() {
  const { data } = useQuery({ queryKey: ["purchases"], queryFn: async () => (await fetch("/api/purchases")).json() });
  return (
    <div>
      <PageHeader title="Purchase orders" description="Supplier orders, receiving and purchase history."
        actions={<Link href="/purchases/new"><Button>New purchase order</Button></Link>} />
      {!data?.orders?.length ? <EmptyState title="No purchase orders" description="Advanced plan unlocks purchase orders." action={<Link href="/purchases/new"><Button>Create PO</Button></Link>} /> : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg/80 dark:bg-white/5"><tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr></thead>
            <tbody>
              {data.orders.map((o: any) => (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="px-4 py-3"><Link className="text-primary font-medium hover:underline" href={`/purchases/${o.id}`}>{o.orderNumber}</Link></td>
                  <td className="px-4 py-3">{o.supplier?.name}</td>
                  <td className="px-4 py-3"><Badge tone={o.status === "RECEIVED" ? "success" : "warning"}>{o.status}</Badge></td>
                  <td className="px-4 py-3">{formatCents(o.totalCents)}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
