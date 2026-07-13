"use client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader, Button, Card, Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { data, refetch } = useQuery({ queryKey: ["notifications"], queryFn: async () => (await fetch("/api/notifications")).json() });

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    toast.success("Marked all as read");
    refetch();
  }

  return (
    <div>
      <PageHeader title="Notifications" description="Low stock, out of stock, sales, purchases and subscription alerts."
        actions={<Button variant="secondary" onClick={markAll}>Mark all read</Button>} />
      <div className="space-y-3">
        {(data?.notifications || []).map((n: any) => (
          <Card key={n.id} className={!n.isRead ? "border-primary/30" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><p className="font-semibold">{n.title}</p><Badge>{n.type}</Badge></div>
                <p className="mt-1 text-sm text-text-secondary">{n.message}</p>
                <p className="mt-2 text-xs text-text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {n.link ? <Link href={n.link} className="text-sm text-primary hover:underline">Open</Link> : null}
            </div>
          </Card>
        ))}
        {!data?.notifications?.length ? <Card><p className="text-sm text-text-secondary">No notifications yet.</p></Card> : null}
      </div>
    </div>
  );
}
