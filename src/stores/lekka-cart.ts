"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LekkaCartLine = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl?: string | null;
};

type LekkaCartState = {
  items: LekkaCartLine[];
  addItem: (item: Omit<LekkaCartLine, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotalCents: () => number;
};

export const useLekkaCart = create<LekkaCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const qty = item.quantity ?? 1;
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                name: item.name,
                unitPriceCents: item.unitPriceCents,
                imageUrl: item.imageUrl,
                quantity: qty,
              },
            ],
          };
        }),
      removeItem: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === productId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents: () => get().items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0),
    }),
    { name: "lekka-cart-v1" },
  ),
);
