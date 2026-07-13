"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Card, Input, Label } from "@/components/ui";

function VerifyForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      toast.success("Email verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card elevated className="w-full max-w-md">
      <h1 className="text-2xl font-bold">Verify email</h1>
      {done ? (
        <div className="mt-4">
          <p className="text-sm text-success">Your email is verified.</p>
          <Link href="/dashboard">
            <Button className="mt-4 w-full">Go to dashboard</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Verification token</Label>
            <Input className="mt-1.5" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify email"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
