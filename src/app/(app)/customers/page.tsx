"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, Label, EmptyState } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const { data, refetch } = useQuery({ queryKey: ["customers"], queryFn: async () => (await fetch("/api/customers")).json() });

  async function create() {
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Customer added"); setOpen(false); refetch();
  }

  return (
    <div>
      <PageHeader title="Customers" description="Profiles, purchase history and loyalty points." actions={<Button onClick={() => setOpen(!open)}>Add customer</Button>} />
      {open ? (
        <Card elevated className="mb-4 grid gap-3 md:grid-cols-2">
          <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input className="mt-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Address</Label><Input className="mt-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="md:col-span-2"><Button onClick={create}>Save</Button></div>
        </Card>
      ) : null}
      {!data?.customers?.length ? <EmptyState title="No customers yet" /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.customers.map((c: any) => (
            <Link key={c.id} href={`/customers/${c.id}`}><Card elevated>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-text-secondary">{c.phone || c.email || "No contact"}</p>
              <p className="mt-2 text-xs">Spent {formatCents(c.totalSpentCents)} · {c.loyaltyPoints} pts</p>
            </Card></Link>
          ))}
        </div>
      )}
    </div>
  );
}
