"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, Badge } from "@/components/ui";

type ShopRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  rejectionReason: string | null;
  owner: { fullName: string; email: string } | null;
  subscription: { plan: string; status: string } | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(status = filter) {
    setLoading(true);
    try {
      const q = status === "ALL" ? "" : `?status=${status}`;
      const res = await fetch(`/api/admin/businesses${q}`);
      if (res.status === 403) {
        toast.error("Admin access only");
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setShops(data.businesses || []);
    } catch {
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function act(id: string, action: "APPROVE" | "REJECT") {
    const reason =
      action === "REJECT" ? window.prompt("Rejection reason (optional):") || undefined : undefined;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      toast.success(action === "APPROVE" ? "Shop approved" : "Shop rejected");
      await load(filter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="gradient-hero mx-auto min-h-dvh max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-caps text-primary">Platform admin</p>
          <h1 className="mt-1 text-3xl font-extrabold">Approve new shops</h1>
          <p className="mt-2 text-sm text-text-secondary">
            New registrations wait here until you approve them. Then they can pay and use TammyShop.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "primary" : "secondary"}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : shops.length === 0 ? (
        <Card elevated>
          <p className="text-sm text-text-secondary">No shops in this list.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shops.map((shop) => (
            <Card key={shop.id} elevated className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{shop.name}</h2>
                  <Badge
                    tone={
                      shop.approvalStatus === "APPROVED"
                        ? "accent"
                        : shop.approvalStatus === "REJECTED"
                          ? "danger"
                          : "default"
                    }
                  >
                    {shop.approvalStatus}
                  </Badge>
                  {shop.subscription ? (
                    <Badge>
                      {shop.subscription.plan} · {shop.subscription.status}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {shop.owner?.fullName || "Owner"} · {shop.owner?.email || shop.email || "—"}
                  {shop.phone ? ` · ${shop.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Registered {new Date(shop.createdAt).toLocaleString("en-ZA")}
                </p>
                {shop.rejectionReason ? (
                  <p className="mt-2 text-sm text-warning">Reason: {shop.rejectionReason}</p>
                ) : null}
              </div>
              {shop.approvalStatus === "PENDING" || shop.approvalStatus === "REJECTED" ? (
                <div className="flex gap-2">
                  <Button
                    disabled={busyId === shop.id}
                    onClick={() => act(shop.id, "APPROVE")}
                  >
                    Approve
                  </Button>
                  {shop.approvalStatus === "PENDING" ? (
                    <Button
                      variant="secondary"
                      disabled={busyId === shop.id}
                      onClick={() => act(shop.id, "REJECT")}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Button variant="secondary" disabled={busyId === shop.id} onClick={() => act(shop.id, "REJECT")}>
                  Revoke
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-text-muted">
        <Link href="/" className="text-primary">
          TammyShop home
        </Link>
      </p>
    </div>
  );
}
