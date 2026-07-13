"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, Card, Badge } from "@/components/ui";

export default function UsersSettingsPage() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });

  return (
    <div>
      <PageHeader
        title="Users & permissions"
        description="Owner, Manager and Employee roles control access across TammyShop."
      />
      <Card elevated className="mb-4 text-sm text-text-secondary">
        <p>
          <strong>Owner</strong> — full access including billing and destructive actions.
        </p>
        <p className="mt-2">
          <strong>Manager</strong> — inventory, sales, purchases, reports and settings (no billing delete).
        </p>
        <p className="mt-2">
          <strong>Employee</strong> — POS, product viewing and customer lookup.
        </p>
      </Card>
      <div className="space-y-3">
        {(data?.users || []).map((u: { id: string; fullName: string; email: string; role: string; isActive: boolean; lastLoginAt?: string }) => (
          <Card key={u.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{u.fullName}</p>
              <p className="text-sm text-text-secondary">{u.email}</p>
              <p className="text-xs text-text-muted">
                Last login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{u.role}</Badge>
              <Badge tone={u.isActive ? "success" : "warning"}>{u.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
