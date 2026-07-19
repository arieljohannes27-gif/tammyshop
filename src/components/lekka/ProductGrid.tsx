import { ProductCard, type StoreProduct } from "@/components/lekka/ProductCard";

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  if (!products.length) {
    return (
      <div className="rounded-[var(--lekka-radius-lg)] border border-dashed border-[var(--lekka-border)] px-6 py-16 text-center">
        <p
          className="text-2xl text-[var(--lekka-text)]"
          style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
        >
          The shelves are being set
        </p>
        <p className="mt-2 text-[var(--lekka-muted)]">Check back shortly for fresh stock.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
