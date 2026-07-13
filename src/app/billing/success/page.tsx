"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

function SuccessInner() {
  const params = useSearchParams();
  const plan = params.get("plan");
  const simulated = params.get("simulated");
  const [status, setStatus] = useState<"confirming" | "ready" | "error">(
    simulated ? "ready" : "confirming",
  );

  useEffect(() => {
    if (simulated) return;
    let cancelled = false;
    let tries = 0;

    async function poll() {
      tries += 1;
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const paid =
            data?.subscription?.status === "ACTIVE" &&
            (data?.subscription?.plan === "STARTER" || data?.subscription?.plan === "ADVANCED");
          if (paid) {
            if (!cancelled) setStatus("ready");
            return;
          }
        }
      } catch {
        /* keep polling */
      }
      if (tries >= 12) {
        if (!cancelled) setStatus("error");
        return;
      }
      setTimeout(poll, 1500);
    }

    // Activate locally if returning from simulated / or wait for PayFast ITN
    void fetch("/api/billing/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).finally(() => {
      poll();
    });

    return () => {
      cancelled = true;
    };
  }, [plan, simulated]);

  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4">
      <Card elevated className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">
          {status === "confirming"
            ? "Confirming payment…"
            : status === "error"
              ? "Payment received"
              : "Subscription activated"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {status === "confirming"
            ? "PayFast is confirming your payment — this usually takes a few seconds."
            : status === "error"
              ? "If the dashboard is still locked, wait a moment and refresh — PayFast may still be syncing."
              : plan
                ? `${plan} plan is now active`
                : "Your TammyShop plan is ready."}
          {simulated ? " (demo / simulated checkout)" : ""}
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
