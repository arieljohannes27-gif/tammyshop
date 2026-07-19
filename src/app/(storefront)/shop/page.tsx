import Link from "next/link";
import { LekkaHero } from "@/components/lekka/LekkaHero";
import { MarketSection } from "@/components/lekka/MarketSection";
import { ProductGrid } from "@/components/lekka/ProductGrid";
import {
  LEKKA_COLLECTIONS,
  productsForCollection,
  resolveProductImage,
} from "@/lib/lekka-collections";
import {
  getStorefrontBusiness,
  storefrontBrandName,
  storefrontLocation,
} from "@/lib/storefront";
import { listProducts } from "@/services/catalog.service";

export const dynamic = "force-dynamic";

export default async function LekkaHomePage() {
  const brand = storefrontBrandName();
  const location = storefrontLocation();

  let products: {
    id: string;
    name: string;
    description: string | null;
    sellPriceCents: number;
    imageUrl: string | null;
    quantity: number;
    isActive: boolean;
  }[] = [];

  try {
    const business = await getStorefrontBusiness();
    products = await listProducts({ businessId: business.id, includeArchived: false });
  } catch {
    products = [];
  }

  const active = products.filter((p) => p.isActive);
  const toCard = (p: (typeof active)[number]) => ({
    id: p.id,
    name: p.name,
    description: null as string | null,
    sellPriceCents: p.sellPriceCents,
    imageUrl: resolveProductImage(p.name, p.imageUrl),
    quantityAvailable: Number(p.quantity),
  });

  const featuredIds = new Set<string>();
  const homeCollections = LEKKA_COLLECTIONS.slice(0, 4).map((collection, index) => {
    const picks = productsForCollection(collection, active, 4).filter((p) => !featuredIds.has(p.id));
    picks.forEach((p) => featuredIds.add(p.id));
    // if filter emptied the rail, fall back without uniqueness
    const rail = picks.length ? picks : productsForCollection(collection, active, 4);
    return { collection, products: rail.map(toCard), reverse: index % 2 === 1 };
  });

  const favourites = active.filter((p) => !featuredIds.has(p.id)).slice(0, 4);
  const favouritesCards = (favourites.length ? favourites : active.slice(0, 4)).map(toCard);

  return (
    <>
      <LekkaHero brand={brand} location={location} />

      <section className="lekka-band border-b border-[var(--lekka-border)]">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-8 sm:py-20">
          <p className="text-sm font-medium text-[var(--lekka-fresh)]">Welcome to {location}</p>
          <h2 className="lekka-display mt-3 text-3xl text-[var(--lekka-text)] sm:text-4xl">
            Not a supermarket. A neighbourhood market.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--lekka-muted)]">
            Affordable everyday food, with the calm of a place that knows your street —
            browse by occasion, collect from the red shop.
          </p>
        </div>
      </section>

      {homeCollections.map(({ collection, products: rail, reverse }) => (
        <MarketSection
          key={collection.id}
          id={collection.id}
          eyebrow={collection.eyebrow}
          title={collection.title}
          blurb={collection.blurb}
          lifestyleImage={collection.lifestyleImage}
          lifestyleAlt={collection.lifestyleAlt}
          products={rail}
          reverse={reverse}
        />
      ))}

      <section className="border-t border-[var(--lekka-border)] bg-[var(--lekka-surface)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-12 max-w-lg">
            <p className="text-sm font-medium text-[var(--lekka-muted)]">Neighbourhood favourites</p>
            <h2 className="lekka-display mt-2 text-3xl sm:text-4xl">What locals keep coming back for</h2>
          </div>
          <ProductGrid products={favouritesCards} />
          <div className="mt-12 text-center">
            <Link href="/shop/products" className="lekka-btn-quiet">
              See everything in the market
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
