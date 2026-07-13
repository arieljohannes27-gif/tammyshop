"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

function SuccessInner() {
  const params = useSearchParams();
  const plan = params.get("plan");
  const simulated = params.get("simulated");
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"idle" | "confirming" | "ready" | "error">(
    sessionId && !simulated ? "confirming" : "ready",
  );
  const [activePlan, setActivePlan] = useState(plan);

  useEffect(() => {
    if (!sessionId || simulated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          return;
        }
        setActivePlan(data.plan || plan);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, simulated, plan]);

  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4">
      <Card elevated className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">
          {status === "confirming" ? "Confirming payment…" : status === "error" ? "Payment received" : "Subscription activated"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {status === "confirming"
            ? "Unlocking your TammyShop account…"
            : status === "error"
              ? "If the dashboard is locked, wait a moment or contact support — Stripe may still be syncing."
              : activePlan
                ? `${activePlan} plan is now active`
                : "Your TammyShop plan is ready."}
          {simulated ? " (simulated Stripe checkout)" : ""}
        </p>
        <Link href="/dashboard">
          <Button className="mt-6 w-full" disabled={status === "confirming"}>
            Go to dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
