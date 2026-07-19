"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useLekkaCart } from "@/stores/lekka-cart";

export function CheckoutForm() {
  const router = useRouter();
  const items = useLekkaCart((s) => s.items);
  const clear = useLekkaCart((s) => s.clear);
  const subtotalCents = useLekkaCart((s) => s.subtotalCents());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `checkout-${Date.now()}`;

      const res = await fetch("/api/storefront/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customerName: name.trim() || undefined,
          customerEmail: email.trim() || undefined,
          customerPhone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      clear();
      router.push(`/shop/order/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <div className="lekka-card px-6 py-12 text-center">
        <p style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }} className="text-2xl">
          Your bag is empty
        </p>
        <a href="/shop/products" className="lekka-btn-primary mt-6 inline-flex">
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="lekka-card space-y-5 p-5 sm:p-7">
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
        >
          Your details
        </h2>
        <p className="text-sm text-[var(--lekka-muted)]">
          Pay on collection for now — we confirm your order instantly and reserve stock.
        </p>
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-[var(--lekka-radius-sm)] border border-[var(--lekka-border)] bg-white px-3 outline-none focus:border-[var(--lekka-red)]"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-[var(--lekka-radius-sm)] border border-[var(--lekka-border)] bg-white px-3 outline-none focus:border-[var(--lekka-red)]"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-[var(--lekka-radius-sm)] border border-[var(--lekka-border)] bg-white px-3 outline-none focus:border-[var(--lekka-red)]"
            autoComplete="tel"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-[var(--lekka-radius-sm)] border border-[var(--lekka-border)] bg-white px-3 py-2 outline-none focus:border-[var(--lekka-red)]"
            placeholder="Collection time, substitutions…"
          />
        </label>
        {error && <p className="text-sm text-[var(--lekka-red)]">{error}</p>}
      </div>

      <div className="lekka-card h-fit space-y-4 p-5 sm:p-7 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <ul className="space-y-3 border-b border-[var(--lekka-border)] pb-4">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--lekka-muted)]">
                {i.quantity}× {i.name}
              </span>
              <span className="font-medium">{formatCurrency(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(subtotalCents)}</span>
        </div>
        <button type="submit" disabled={loading} className="lekka-btn-primary w-full disabled:opacity-60">
          {loading ? "Placing order…" : "Place order"}
        </button>
      </div>
    </form>
  );
}
