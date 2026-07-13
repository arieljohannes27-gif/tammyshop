"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, Label, EmptyState } from "@/components/ui";
import { formatCents } from "@/lib/utils";

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contactName: "", email: "", phone: "", address: "", notes: "" });
  const { data, refetch, isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: async () => (await fetch("/api/suppliers")).json() });

  async function create() {
    const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Failed — Advanced plan required");
    toast.success("Supplier added");
    setOpen(false); setForm({ name: "", contactName: "", email: "", phone: "", address: "", notes: "" }); refetch();
  }

  return (
    <div>
      <PageHeader title="Suppliers" description="Directory, contacts and outstanding balances." actions={<Button onClick={() => setOpen(!open)}>Add supplier</Button>} />
      {open ? (
        <Card elevated className="mb-4 grid gap-3 md:grid-cols-2">
          <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Contact</Label><Input className="mt-1" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></div>
          <div><Label>Email</Label><Input className="mt-1" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input className="mt-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="md:col-span-2"><Button onClick={create}>Save</Button></div>
        </Card>
      ) : null}
      {!isLoading && !data?.suppliers?.length ? <EmptyState title="No suppliers" description="Advanced plan unlocks supplier management." /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.suppliers || []).map((s: any) => (
            <Link key={s.id} href={`/suppliers/${s.id}`}><Card elevated className="hover:border-primary/40 transition">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-text-secondary">{s.contactName || s.phone || s.email || "No contact"}</p>
              <p className="mt-2 text-xs text-warning">Outstanding {formatCents(s.outstandingBalanceCents)}</p>
            </Card></Link>
          ))}
        </div>
      )}
    </div>
  );
}
