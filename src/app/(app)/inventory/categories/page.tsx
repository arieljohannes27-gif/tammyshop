"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, EmptyState } from "@/components/ui";

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await fetch("/api/categories")).json(),
  });

  async function add() {
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error);
    toast.success("Category added");
    setName("");
    refetch();
  }

  return (
    <div>
      <PageHeader title="Categories" description="Organize products into clear categories." />
      <Card elevated className="mb-4 flex gap-2">
        <Input placeholder="New category" value={name} onChange={e => setName(e.target.value)} />
        <Button onClick={add} disabled={!name.trim()}>Add</Button>
      </Card>
      {!data?.categories?.length ? <EmptyState title="No categories" /> : (
        <div className="grid gap-3 md:grid-cols-3">
          {data.categories.map((c: { id: string; name: string; _count: { products: number } }) => (
            <Card key={c.id}><p className="font-semibold">{c.name}</p><p className="text-sm text-text-secondary">{c._count.products} products</p></Card>
          ))}
        </div>
      )}
    </div>
  );
}
