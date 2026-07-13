"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Card, Badge, Skeleton, Button } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function SalesHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await fetch("/api/sales?limit=100")).json(),
  });
  return (
    <div>
      <PageHeader title="Sales history" description="All completed sales, refunds and invoices." actions={<Link href="/sales"><Button>Open POS</Button></Link>} />
      {isLoading ? <Skeleton className="h-64" /> : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg/80 text-text-secondary dark:bg-white/5"><tr>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr></thead>
            <tbody>
              {(data?.sales || []).map((s: any) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="px-4 py-3"><Link className="font-medium text-primary hover:underline" href={`/sales/${s.id}`}>{s.invoiceNumber}</Link></td>
                  <td className="px-4 py-3">{s.customer?.name || "Walk-in"}</td>
                  <td className="px-4 py-3">{s.paymentMethod}</td>
                  <td className="px-4 py-3 font-semibold">{formatCents(s.totalCents)}</td>
                  <td className="px-4 py-3"><Badge tone={s.status === "COMPLETED" ? "success" : "warning"}>{s.status}</Badge></td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
