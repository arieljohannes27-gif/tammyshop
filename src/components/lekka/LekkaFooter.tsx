import Link from "next/link";

export function LekkaFooter({ brand, location }: { brand: string; location: string }) {
  return (
    <footer className="mt-auto border-t border-[var(--lekka-border)] bg-[var(--lekka-surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lekka-muted)]">
            {location}
          </p>
          <p
            className="mt-1 text-2xl text-[var(--lekka-text)]"
            style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
          >
            {brand}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--lekka-muted)]">
            Neighbourhood market shopping — calm, trusted, and ready when you are.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[var(--lekka-muted)]">
          <Link href="/shop/products" className="hover:text-[var(--lekka-text)]">
            Shop
          </Link>
          <Link href="/shop/cart" className="hover:text-[var(--lekka-text)]">
            Cart
          </Link>
        </div>
      </div>
    </footer>
  );
}
