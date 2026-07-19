import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/lekka/ProductGrid";
import type { StoreProduct } from "@/components/lekka/ProductCard";

export function MarketSection({
  id,
  eyebrow,
  title,
  blurb,
  lifestyleImage,
  lifestyleAlt,
  products,
  reverse,
}: {
  id: string;
  eyebrow: string;
  title: string;
  blurb: string;
  lifestyleImage: string;
  lifestyleAlt: string;
  products: StoreProduct[];
  reverse?: boolean;
}) {
  return (
    <section id={id} className="border-t border-[var(--lekka-border)]/80">
      <div className={`grid lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative min-h-[280px] bg-[var(--lekka-bg-stone)] lg:min-h-[420px]">
          <Image
            src={lifestyleImage}
            alt={lifestyleAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center bg-[var(--lekka-bg)] px-5 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-sm font-medium text-[var(--lekka-fresh)]">{eyebrow}</p>
          <h2 className="lekka-display mt-3 text-3xl text-[var(--lekka-text)] sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--lekka-muted)]">{blurb}</p>
          <Link
            href={`/shop/products?collection=${id}`}
            className="mt-8 inline-flex text-sm font-medium text-[var(--lekka-text)] underline-offset-4 hover:underline"
          >
            Browse this aisle
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <ProductGrid products={products} columns="rail" />
      </div>
    </section>
  );
}
