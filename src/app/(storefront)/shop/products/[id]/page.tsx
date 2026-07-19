import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/lekka/AddToCartButton";
import { resolveProductImage } from "@/lib/lekka-collections";
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
  const image = resolveProductImage(product.name, product.imageUrl);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-2 lg:gap-20">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--lekka-radius-lg)] bg-[var(--lekka-bg-stone)]">
        <Image
          src={image}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-center">
        <Link
          href="/shop/products"
          className="mb-8 text-sm text-[var(--lekka-muted)] hover:text-[var(--lekka-text)]"
        >
          Back to the market
        </Link>
        {product.category && (
          <p className="text-sm font-medium text-[var(--lekka-fresh)]">{product.category.name}</p>
        )}
        <h1 className="lekka-display mt-2 text-4xl leading-tight text-[var(--lekka-text)] sm:text-5xl">
          {product.name}
        </h1>
        <p className="mt-5 text-2xl tracking-tight text-[var(--lekka-text)]">
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
            imageUrl={image}
            disabled={!inStock}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--lekka-muted)]">
          {inStock
            ? "Ready at the shop — pay when you collect."
            : "Currently unavailable — check back soon."}
        </p>
      </div>
    </div>
  );
}
