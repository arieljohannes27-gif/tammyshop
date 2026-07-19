import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/lekka/AddToCartButton";
import { formatCurrency } from "@/lib/utils";
import { getStorefrontBusiness } from "@/lib/storefront";
import { getProduct } from "@/services/catalog.service";

type Props = { params: Promise<{ id: string }> };

export default async function LekkaProductPage({ params }: Props) {
  const { id } = await params;
  const business = await getStorefrontBusiness();
  const product = await getProduct(business.id, id);
  if (!product || !product.isActive || product.isArchived) notFound();

  const inStock = Number(product.quantity) > 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-28 sm:px-8 lg:grid-cols-2 lg:gap-16">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--lekka-radius-lg)] bg-[#f0ebe3]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="text-8xl text-[var(--lekka-muted)]/35"
              style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
            >
              {product.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <Link
          href="/shop/products"
          className="mb-6 text-sm font-medium text-[var(--lekka-muted)] hover:text-[var(--lekka-text)]"
        >
          ← Back to market
        </Link>
        {product.category && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lekka-fresh)]">
            {product.category.name}
          </p>
        )}
        <h1
          className="mt-2 text-4xl leading-tight text-[var(--lekka-text)] sm:text-5xl"
          style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
        >
          {product.name}
        </h1>
        <p className="mt-5 text-3xl font-semibold tracking-tight">
          {formatCurrency(product.sellPriceCents)}
        </p>
        {product.description && (
          <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--lekka-muted)]">
            {product.description}
          </p>
        )}
        <div className="mt-10">
          <AddToCartButton
            productId={product.id}
            name={product.name}
            unitPriceCents={product.sellPriceCents}
            imageUrl={product.imageUrl}
            disabled={!inStock}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--lekka-muted)]">
          {inStock ? "In stock · collect from the shop" : "Currently unavailable"}
        </p>
      </div>
    </div>
  );
}
