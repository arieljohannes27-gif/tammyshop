"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Label, Select } from "@/components/ui";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    businessName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    plan: (params.get("plan") as "FREE" | "STARTER" | "ADVANCED") || "FREE",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      toast.success("Account created");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card elevated className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary font-bold text-white">T</div>
          <span className="text-xl font-bold">TammyShop</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Create your shop</h1>
        <p className="mt-1 text-sm text-text-secondary">Start managing inventory in minutes</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Business name</Label>
          <Input
            className="mt-1.5"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Your name</Label>
          <Input className="mt-1.5" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div>
          <Label>Phone</Label>
          <Input className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label>Email</Label>
          <Input
            type="email"
            className="mt-1.5"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            className="mt-1.5"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
        </div>
        <div>
          <Label>Plan</Label>
          <Select
            className="mt-1.5"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value as typeof form.plan })}
          >
            <option value="FREE">Free trial</option>
            <option value="STARTER">Starter — R50/mo</option>
            <option value="ADVANCED">Advanced — R119/mo</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4 py-10">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
