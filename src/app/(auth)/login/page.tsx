"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Label } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      toast.success("Welcome back");
      if (data.user?.isPlatformAdmin) {
        router.replace("/admin");
      } else {
        router.replace(params.get("next") || "/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card elevated className="w-full max-w-md">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary font-bold text-white">T</div>
          <span className="text-xl font-bold">TammyShop</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to manage your shop</p>
      </div>
      <div className="mb-4 rounded-xl border border-border bg-bg/60 p-3 text-left text-xs text-text-secondary">
        <p className="font-semibold text-text">Demo login</p>
        <p className="mt-1">Email: <span className="font-mono text-text">demo@tammyshop.co.za</span></p>
        <p>Password: <span className="font-mono text-text">Demo1234!</span></p>
        <p className="mt-2 font-semibold text-text">Admin (approve shops)</p>
        <p className="mt-1">Email: <span className="font-mono text-text">admin@tammyshop.co.za</span></p>
        <p>Password: <span className="font-mono text-text">AdminDemo2026!</span></p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        No account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
