import { ProductCard, type StoreProduct } from "@/components/lekka/ProductCard";

export function ProductGrid({
  products,
  columns = "market",
}: {
  products: StoreProduct[];
  columns?: "market" | "rail";
}) {
  if (!products.length) {
    return (
      <div className="rounded-[var(--lekka-radius-lg)] border border-dashed border-[var(--lekka-border)] bg-[var(--lekka-surface)] px-6 py-16 text-center">
        <p className="lekka-display text-2xl text-[var(--lekka-text)]">The shelves are being set</p>
        <p className="mt-2 text-[var(--lekka-muted)]">Pop back shortly for what’s fresh.</p>
      </div>
    );
  }

  const grid =
    columns === "rail"
      ? "grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-8"
      : "grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-10 lg:grid-cols-3";

  return (
    <div className={grid}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
