"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useLekkaCart } from "@/stores/lekka-cart";

export function LekkaNav({ brand, location }: { brand: string; location: string }) {
  const pathname = usePathname();
  const count = useLekkaCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = mounted ? count : 0;

  const onHome = pathname === "/shop";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,backdrop-filter] duration-200 ${
        scrolled || !onHome
          ? "lekka-glass shadow-[0_1px_0_rgba(28,25,23,0.06)]"
          : "bg-gradient-to-b from-black/35 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <Link href="/shop" className="shrink-0">
          <span
            className={`block text-[11px] font-semibold uppercase tracking-[0.22em] ${
              scrolled || !onHome ? "text-[var(--lekka-muted)]" : "text-white/75"
            }`}
          >
            {location}
          </span>
          <span
            className={`block text-sm font-bold uppercase tracking-[0.08em] sm:text-base ${
              scrolled || !onHome ? "text-[var(--lekka-text)]" : "text-white"
            }`}
          >
            {brand}
          </span>
        </Link>

        <form action="/shop/products" className="relative mx-auto hidden min-w-0 flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lekka-muted)]" />
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the market"
            className="h-12 w-full rounded-full border border-[var(--lekka-border)] bg-[var(--lekka-surface)] pl-11 pr-4 text-[15px] text-[var(--lekka-text)] outline-none transition focus:border-[var(--lekka-red)] focus:ring-2 focus:ring-[var(--lekka-red-soft)]"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/shop/products"
            className={`hidden rounded-full px-3 py-2 text-sm font-medium transition sm:inline ${
              scrolled || !onHome
                ? "text-[var(--lekka-muted)] hover:text-[var(--lekka-text)]"
                : "text-white/85 hover:text-white"
            }`}
          >
            Shop
          </Link>
          <Link
            href="/shop/cart"
            className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full transition ${
              scrolled || !onHome
                ? "text-[var(--lekka-text)] hover:bg-[var(--lekka-red-soft)]"
                : "text-white hover:bg-white/15"
            }`}
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lekka-red)] px-1 text-[11px] font-semibold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {(scrolled || !onHome) && (
        <form action="/shop/products" className="border-t border-[var(--lekka-border)]/60 px-4 py-2 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lekka-muted)]" />
            <input
              name="q"
              placeholder="Search the market"
              className="h-11 w-full rounded-full border border-[var(--lekka-border)] bg-[var(--lekka-surface)] pl-10 pr-4 text-sm outline-none focus:border-[var(--lekka-red)]"
            />
          </div>
        </form>
      )}
    </header>
  );
}
