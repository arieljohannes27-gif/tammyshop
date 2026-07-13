"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button, Card } from "@/components/ui";

function SuccessInner() {
  const params = useSearchParams();
  const plan = params.get("plan");
  const simulated = params.get("simulated");

  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4">
      <Card elevated className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Subscription activated</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {plan ? `${plan} plan is now active` : "Your TammyShop plan is ready."}
          {simulated ? " (simulated Stripe checkout)" : ""}
        </p>
        <Link href="/dashboard">
          <Button className="mt-6 w-full">Go to dashboard</Button>
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
