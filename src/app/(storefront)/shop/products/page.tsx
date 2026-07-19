import { ProductGrid } from "@/components/lekka/ProductGrid";
import {
  LEKKA_COLLECTIONS,
  productsForCollection,
  resolveProductImage,
} from "@/lib/lekka-collections";
import { getStorefrontBusiness } from "@/lib/storefront";
import { listProducts } from "@/services/catalog.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; collection?: string }> };

export default async function LekkaProductsPage({ searchParams }: Props) {
  const { q, collection: collectionId } = await searchParams;
  const collection = LEKKA_COLLECTIONS.find((c) => c.id === collectionId);

  let active: {
    id: string;
    name: string;
    description: string | null;
    sellPriceCents: number;
    imageUrl: string | null;
    quantity: number;
  }[] = [];

  try {
    const business = await getStorefrontBusiness();
    const products = await listProducts({
      businessId: business.id,
      q: q?.trim() || undefined,
      includeArchived: false,
    });
    active = products
      .filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sellPriceCents: p.sellPriceCents,
        imageUrl: p.imageUrl,
        quantity: Number(p.quantity),
      }));
  } catch {
    active = [];
  }

  const filtered = collection ? productsForCollection(collection, active, 24) : active;

  const title = q
    ? `Results for “${q}”`
    : collection
      ? collection.title
      : "The market";

  const subtitle = q
    ? "Find what you need — clear prices, ready to collect."
    : collection
      ? collection.blurb
      : "Browse by aisle, or take your time. Everything here is ready for collection.";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8">
      <header className="mb-10 max-w-xl">
        <p className="text-sm font-medium text-[var(--lekka-muted)]">
          {collection ? collection.eyebrow : "Aisles"}
        </p>
        <h1 className="lekka-display mt-2 text-4xl text-[var(--lekka-text)] sm:text-[2.75rem]">
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--lekka-muted)]">{subtitle}</p>
      </header>

      <div className="mb-10 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AisleChip href="/shop/products" active={!collectionId && !q} label="All" />
        {LEKKA_COLLECTIONS.map((c) => (
          <AisleChip
            key={c.id}
            href={`/shop/products?collection=${c.id}`}
            active={collectionId === c.id}
            label={c.title}
          />
        ))}
      </div>

      <ProductGrid
        products={filtered.map((p) => ({
          id: p.id,
          name: p.name,
          description: null,
          sellPriceCents: p.sellPriceCents,
          imageUrl: resolveProductImage(p.name, p.imageUrl),
          quantityAvailable: p.quantity,
        }))}
      />
    </div>
  );
}

function AisleChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm transition ${
        active
          ? "bg-[var(--lekka-text)] text-white"
          : "bg-[var(--lekka-surface)] text-[var(--lekka-muted)] ring-1 ring-[var(--lekka-border)] hover:text-[var(--lekka-text)]"
      }`}
    >
      {label}
    </Link>
  );
}
