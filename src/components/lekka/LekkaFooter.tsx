import Link from "next/link";
import { LEKKA_COLLECTIONS } from "@/lib/lekka-collections";

export function LekkaFooter({ brand, location }: { brand: string; location: string }) {
  return (
    <footer className="mt-auto border-t border-[var(--lekka-border)] bg-[var(--lekka-bg-stone)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:flex-row sm:justify-between sm:px-8">
        <div>
          <p className="lekka-display text-2xl text-[var(--lekka-text)]">{brand}</p>
          <p className="mt-1 text-sm text-[var(--lekka-muted)]">{location}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--lekka-muted)]">
            A premium neighbourhood market — warm, trusted, and easy to collect from.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-[var(--lekka-muted)]">
          {LEKKA_COLLECTIONS.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/shop/products?collection=${c.id}`}
              className="hover:text-[var(--lekka-text)]"
            >
              {c.title}
            </Link>
          ))}
          <Link href="/shop/cart" className="hover:text-[var(--lekka-text)]">
            Your bag
          </Link>
        </div>
      </div>
    </footer>
  );
}
