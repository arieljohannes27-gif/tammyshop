import Link from "next/link";
import { LekkaHero } from "@/components/lekka/LekkaHero";
import { ProductGrid } from "@/components/lekka/ProductGrid";
import { listProducts } from "@/services/catalog.service";
import {
  getStorefrontBusiness,
  storefrontBrandName,
  storefrontLocation,
} from "@/lib/storefront";

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

  const featured = products.filter((p) => p.isActive).slice(0, 8);

  return (
    <>
      <LekkaHero brand={brand} location={location} />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lekka-fresh)]">
              Fresh picks
            </p>
            <h2
              className="mt-2 text-3xl text-[var(--lekka-text)] sm:text-4xl"
              style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
            >
              From the market
            </h2>
          </div>
          <Link
            href="/shop/products"
            className="hidden text-sm font-semibold text-[var(--lekka-red)] sm:inline"
          >
            View all
          </Link>
        </div>

        <ProductGrid
          products={featured.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            sellPriceCents: p.sellPriceCents,
            imageUrl: p.imageUrl,
            quantityAvailable: Number(p.quantity),
          }))}
        />

        <div className="mt-10 text-center sm:hidden">
          <Link href="/shop/products" className="lekka-btn-primary inline-flex">
            View all
          </Link>
        </div>
      </section>
    </>
  );
}
