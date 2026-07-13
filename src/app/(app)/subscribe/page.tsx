"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { PRICING } from "@/types";

function SubscribeInner() {
  const params = useSearchParams();
  const preferred = (params.get("plan") as "STARTER" | "ADVANCED" | null) || "STARTER";
  const [busy, setBusy] = useState<"STARTER" | "ADVANCED" | null>(null);

  async function checkout(plan: "STARTER" | "ADVANCED") {
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      toast.success("Subscription activated");
      window.location.href = "/dashboard";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="gradient-hero mx-auto flex min-h-dvh max-w-4xl flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary font-bold text-white">T</div>
          <span className="text-xl font-bold">TammyShop</span>
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold">Choose your plan to continue</h1>
        <p className="mt-2 text-text-secondary">
          Your account is ready. Activate Starter or Advanced to unlock inventory, POS and reports.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card elevated className={preferred === "STARTER" ? "ring-2 ring-primary/30" : ""}>
          <Badge>Starter</Badge>
          <p className="mt-3 text-4xl font-extrabold">
            R{PRICING.STARTER.monthlyZar}
            <span className="text-base font-medium text-text-secondary">/month</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-text-secondary">
            {[
              "Unlimited products",
              "POS & inventory",
              "Barcode support",
              "Reports & basic analytics",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" /> {f}
              </li>
            ))}
          </ul>
          <Button className="mt-6 w-full" variant="secondary" disabled={!!busy} onClick={() => checkout("STARTER")}>
            {busy === "STARTER" ? "Redirecting..." : "Pay R50 / month"}
          </Button>
        </Card>

        <Card elevated className={`border-primary/40 ${preferred === "ADVANCED" ? "ring-2 ring-primary/30" : ""}`}>
          <Badge tone="accent">Advanced</Badge>
          <p className="mt-3 text-4xl font-extrabold">
            R{PRICING.ADVANCED.monthlyZar}
            <span className="text-base font-medium text-text-secondary">/month</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-text-secondary">
            {[
              "Everything in Starter",
              "AI shopping list",
              "Suppliers & purchase orders",
              "Profit & stock intelligence",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" /> {f}
              </li>
            ))}
          </ul>
          <Button className="mt-6 w-full" disabled={!!busy} onClick={() => checkout("ADVANCED")}>
            {busy === "ADVANCED" ? "Redirecting..." : "Pay R119 / month"}
          </Button>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        Payments via Stripe when configured. Without Stripe keys, checkout activates the plan in demo mode so you can test the flow.
      </p>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeInner />
    </Suspense>
  );
}
