import { ProductGrid } from "@/components/lekka/ProductGrid";
import { listCategories, listProducts } from "@/services/catalog.service";
import { getStorefrontBusiness } from "@/lib/storefront";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; category?: string }> };

export default async function LekkaProductsPage({ searchParams }: Props) {
  const { q, category } = await searchParams;

  let filtered: {
    id: string;
    name: string;
    description: string | null;
    sellPriceCents: number;
    imageUrl: string | null;
    quantity: number;
  }[] = [];
  let categories: { id: string; name: string }[] = [];

  try {
    const business = await getStorefrontBusiness();
    const [products, cats] = await Promise.all([
      listProducts({ businessId: business.id, q: q?.trim() || undefined, includeArchived: false }),
      listCategories(business.id),
    ]);
    categories = cats.map((c) => ({ id: c.id, name: c.name }));
    const active = products.filter((p) => p.isActive);
    filtered = (category ? active.filter((p) => p.categoryId === category) : active).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sellPriceCents: p.sellPriceCents,
      imageUrl: p.imageUrl,
      quantity: Number(p.quantity),
    }));
  } catch {
    filtered = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-10 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lekka-muted)]">
          Catalogue
        </p>
        <h1
          className="mt-2 text-4xl text-[var(--lekka-text)]"
          style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
        >
          {q ? `Results for “${q}”` : "The market"}
        </h1>
        <p className="mt-3 text-[var(--lekka-muted)]">
          Curated everyday essentials — clear prices, ready to collect.
        </p>
      </header>

      {categories.length > 0 && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChip href="/shop/products" active={!category} label="All" />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              href={`/shop/products?category=${c.id}`}
              active={category === c.id}
              label={c.name}
            />
          ))}
        </div>
      )}

      <ProductGrid
        products={filtered.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          sellPriceCents: p.sellPriceCents,
          imageUrl: p.imageUrl,
          quantityAvailable: p.quantity,
        }))}
      />
    </div>
  );
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition ${
        active
          ? "bg-[var(--lekka-text)] text-white"
          : "bg-[var(--lekka-surface)] text-[var(--lekka-muted)] ring-1 ring-[var(--lekka-border)] hover:text-[var(--lekka-text)]"
      }`}
    >
      {label}
    </a>
  );
}
