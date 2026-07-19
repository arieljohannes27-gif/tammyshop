"use client";

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

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItem({ productId, name, unitPriceCents, imageUrl })}
      className="lekka-btn-primary w-full max-w-sm disabled:opacity-40"
    >
      {disabled ? "Sold out" : "Add to bag"}
    </button>
  );
}
