"use client";

import { resolveProductImage } from "@/lib/lekka-collections";
import { useLekkaCart } from "@/stores/lekka-cart";

export function AddToCartButton({
  productId,
  name,
  unitPriceCents,
  imageUrl,
  disabled,
}: {
  productId: string;
  name: string;
  unitPriceCents: number;
  imageUrl?: string | null;
  disabled?: boolean;
}) {
  const addItem = useLekkaCart((s) => s.addItem);
  const image = resolveProductImage(name, imageUrl);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItem({ productId, name, unitPriceCents, imageUrl: image })}
      className="lekka-btn-primary w-full max-w-sm disabled:opacity-40"
    >
      {disabled ? "Sold out" : "Add to bag"}
    </button>
  );
}
