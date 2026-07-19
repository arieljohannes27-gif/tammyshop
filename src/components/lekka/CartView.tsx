"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useLekkaCart } from "@/stores/lekka-cart";

export function CartView() {
  const items = useLekkaCart((s) => s.items);
  const setQty = useLekkaCart((s) => s.setQty);
  const removeItem = useLekkaCart((s) => s.removeItem);
  const subtotalCents = useLekkaCart((s) => s.subtotalCents());

  if (!items.length) {
    return (
      <div className="lekka-card px-6 py-16 text-center">
        <p className="lekka-display text-3xl">Your bag is empty</p>
        <p className="mt-2 text-[var(--lekka-muted)]">Wander the aisles — something good is waiting.</p>
        <Link href="/shop/products" className="lekka-btn-primary mt-8 inline-flex">
          Enter the market
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.productId} className="lekka-card flex gap-4 p-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--lekka-radius-sm)] bg-[#f0ebe3]">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="96px" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-[var(--lekka-muted)]/40">
                  {item.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-snug">{item.name}</h3>
                <p className="shrink-0 font-semibold">
                  {formatCurrency(item.unitPriceCents * item.quantity)}
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--lekka-muted)]">
                {formatCurrency(item.unitPriceCents)} each
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-[var(--lekka-border)]">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center text-lg"
                    onClick={() => setQty(item.productId, item.quantity - 1)}
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center text-lg"
                    onClick={() => setQty(item.productId, item.quantity + 1)}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-[var(--lekka-muted)] underline-offset-2 hover:text-[var(--lekka-red)] hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="lekka-card h-fit space-y-4 p-5 sm:p-7 lg:sticky lg:top-24">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalCents)}</span>
        </div>
        <p className="text-sm text-[var(--lekka-muted)]">Collect from the shop · pay then</p>
        <Link href="/shop/checkout" className="lekka-btn-primary w-full">
          Continue to collect
        </Link>
        <Link
          href="/shop/products"
          className="block text-center text-sm font-medium text-[var(--lekka-muted)] hover:text-[var(--lekka-text)]"
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
