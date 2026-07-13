"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Button, Card, Badge } from "@/components/ui";
import { PRICING } from "@/types";

export default function BillingPage() {
  const { data, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });

  async function checkout(plan: "STARTER" | "ADVANCED") {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Checkout failed");
    if (json.action && json.fields) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = json.action;
      for (const [name, value] of Object.entries(json.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      return;
    }
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    toast.success("Plan updated");
    refetch();
  }

  return (
    <div>
      <PageHeader title="Billing" description="PayFast subscriptions for Starter and Advanced." />
      <Card elevated className="mb-6">
        <p className="label-caps">Current plan</p>
        <p className="mt-2 text-3xl font-bold">{data?.subscription?.plan || "FREE"}</p>
        <Badge className="mt-2">{data?.subscription?.status || "TRIALING"}</Badge>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <Badge>Starter</Badge>
          <p className="mt-3 text-3xl font-extrabold">R{PRICING.STARTER.monthlyZar}/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-text-secondary">
            <li>Unlimited products</li>
            <li>POS, inventory, reports</li>
            <li>Barcode + basic analytics</li>
          </ul>
          <Button className="mt-6 w-full" variant="secondary" onClick={() => checkout("STARTER")}>
            Choose Starter
          </Button>
        </Card>
        <Card elevated className="border-primary/40 ring-2 ring-primary/20">
          <Badge tone="accent">Advanced</Badge>
          <p className="mt-3 text-3xl font-extrabold">R{PRICING.ADVANCED.monthlyZar}/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-text-secondary">
            <li>AI shopping list</li>
            <li>Suppliers & purchase orders</li>
            <li>Forecasts & profit analytics</li>
          </ul>
          <Button className="mt-6 w-full" onClick={() => checkout("ADVANCED")}>
            Choose Advanced
          </Button>
        </Card>
      </div>
    </div>
  );
}
