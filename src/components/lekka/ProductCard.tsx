"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { useLekkaCart } from "@/stores/lekka-cart";

export type StoreProduct = {
  id: string;
  name: string;
  description?: string | null;
  sellPriceCents: number;
  imageUrl?: string | null;
  quantityAvailable: number;
};

export function ProductCard({ product, index = 0 }: { product: StoreProduct; index?: number }) {
  const addItem = useLekkaCart((s) => s.addItem);
  const inStock = product.quantityAvailable > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
      className="lekka-card group flex flex-col overflow-hidden"
    >
      <Link href={`/shop/products/${product.id}`} className="relative block aspect-[4/5] bg-[#f0ebe3]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f0ebe3] to-[#e4dcd0]">
            <span
              className="text-5xl font-medium text-[var(--lekka-muted)]/40"
              style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
            >
              {product.name.charAt(0)}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-h-[3.5rem]">
          <Link href={`/shop/products/${product.id}`}>
            <h3 className="text-[15px] font-semibold leading-snug text-[var(--lekka-text)] sm:text-base">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--lekka-muted)]">{product.description}</p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">{formatCurrency(product.sellPriceCents)}</p>
          <button
            type="button"
            disabled={!inStock}
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                unitPriceCents: product.sellPriceCents,
                imageUrl: product.imageUrl,
              })
            }
            className="min-h-11 rounded-full bg-[var(--lekka-text)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--lekka-red)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {inStock ? "Add" : "Sold out"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
