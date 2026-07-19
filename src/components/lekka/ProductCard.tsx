"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { resolveProductImage } from "@/lib/lekka-collections";
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
  const reduce = useReducedMotion();
  const image = resolveProductImage(product.name, product.imageUrl);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.32, delay: reduce ? 0 : Math.min(index * 0.03, 0.15), ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col"
    >
      <Link
        href={`/shop/products/${product.id}`}
        className="relative mb-4 block aspect-[4/5] overflow-hidden rounded-[var(--lekka-radius)] bg-[var(--lekka-bg-stone)]"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.015]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-0.5">
        <div>
          <Link href={`/shop/products/${product.id}`}>
            <h3 className="text-[15px] font-medium leading-snug text-[var(--lekka-text)] sm:text-base">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-base tracking-tight text-[var(--lekka-text)]">
            {formatCurrency(product.sellPriceCents)}
          </p>
          <button
            type="button"
            disabled={!inStock}
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                unitPriceCents: product.sellPriceCents,
                imageUrl: image,
              })
            }
            className="lekka-btn-quiet disabled:cursor-not-allowed disabled:opacity-40"
          >
            {inStock ? "Add to bag" : "Sold out"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
