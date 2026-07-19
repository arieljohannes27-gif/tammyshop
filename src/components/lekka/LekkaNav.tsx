"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useLekkaCart } from "@/stores/lekka-cart";

const AISLES = [
  { href: "/shop/products?collection=fresh-this-week", label: "Fresh" },
  { href: "/shop/products?collection=weekend-braai", label: "Braai" },
  { href: "/shop/products?collection=baked-this-morning", label: "Bakery" },
  { href: "/shop/products?collection=daily-essentials", label: "Essentials" },
];

export function LekkaNav({ brand, location }: { brand: string; location: string }) {
  const pathname = usePathname();
  const count = useLekkaCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = mounted ? count : 0;
  const onHome = pathname === "/shop";
  const light = onHome && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color] duration-200 ${
        light ? "border-b border-transparent bg-transparent" : "lekka-glass"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/shop" className="shrink-0">
          <span
            className={`block text-[13px] font-medium tracking-wide sm:text-sm ${
              light ? "text-white" : "text-[var(--lekka-text)]"
            }`}
          >
            {brand}
          </span>
          <span
            className={`block text-[11px] ${
              light ? "text-white/70" : "text-[var(--lekka-muted)]"
            }`}
          >
            {location}
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {AISLES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`rounded-full px-3 py-2 text-sm transition ${
                light
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-[var(--lekka-muted)] hover:bg-[var(--lekka-bg-stone)] hover:text-[var(--lekka-text)]"
              }`}
            >
              {a.label}
            </Link>
          ))}
        </nav>

        <form action="/shop/products" className="relative ml-auto hidden min-w-0 max-w-xs flex-1 md:block">
          <Search
            className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
              light ? "text-white/70" : "text-[var(--lekka-muted)]"
            }`}
          />
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search the market"
            className={`h-11 w-full rounded-full pl-10 pr-4 text-sm outline-none transition ${
              light
                ? "border border-white/25 bg-white/15 text-white placeholder:text-white/60 focus:bg-white/25"
                : "border border-[var(--lekka-border)] bg-[var(--lekka-surface)] text-[var(--lekka-text)] focus:border-[var(--lekka-text)]"
            }`}
          />
        </form>

        <Link
          href="/shop/cart"
          className={`relative ml-auto inline-flex h-11 items-center gap-2 rounded-full px-3 transition md:ml-0 ${
            light
              ? "text-white hover:bg-white/10"
              : "text-[var(--lekka-text)] hover:bg-[var(--lekka-bg-stone)]"
          }`}
          aria-label={`Bag, ${cartCount} items`}
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          <span className="hidden text-sm sm:inline">Bag</span>
          {cartCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lekka-red)] px-1 text-[11px] font-medium text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      {!light && (
        <div className="border-t border-[var(--lekka-border)]/70 px-4 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {AISLES.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--lekka-surface)] px-3 text-sm text-[var(--lekka-muted)] ring-1 ring-[var(--lekka-border)]"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
