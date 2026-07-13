"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, EmptyState } from "@/components/ui";

export default function BrandsPage() {
  const [name, setName] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await fetch("/api/brands")).json(),
  });

  async function add() {
    const res = await fetch("/api/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Brand added");
    setName("");
    refetch();
  }

  return (
    <div>
      <PageHeader title="Brands" description="Track product brands across your catalogue." />
      <Card elevated className="mb-4 flex gap-2">
        <Input placeholder="New brand" value={name} onChange={e => setName(e.target.value)} />
        <Button onClick={add} disabled={!name.trim()}>Add</Button>
      </Card>
      {!data?.brands?.length ? <EmptyState title="No brands" /> : (
        <div className="grid gap-3 md:grid-cols-3">
          {data.brands.map((b: { id: string; name: string; _count: { products: number } }) => (
            <Card key={b.id}><p className="font-semibold">{b.name}</p><p className="text-sm text-text-secondary">{b._count.products} products</p></Card>
          ))}
        </div>
      )}
    </div>
  );
}
