"use client";

import { create } from "zustand";
import type { CartItem, PaymentMethod } from "@/types";

interface PosState {
  items: CartItem[];
  discountPercent: number;
  discountCents: number;
  couponCode: string;
  paymentMethod: PaymentMethod;
  customerId?: string;
  cashReceivedCents: number;
  addItem: (item: Omit<CartItem, "discountCents"> & { discountCents?: number }) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  setDiscountPercent: (v: number) => void;
  setDiscountCents: (v: number) => void;
  setCoupon: (code: string) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setCustomerId: (id?: string) => void;
  setCashReceived: (cents: number) => void;
  clear: () => void;
  subtotalCents: () => number;
  totalCents: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  discountPercent: 0,
  discountCents: 0,
  couponCode: "",
  paymentMethod: "CASH",
  cashReceivedCents: 0,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, discountCents: item.discountCents ?? 0 }] };
    }),
  removeItem: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  setQty: (productId, quantity) =>
    set((s) => ({
      items: s.items
        .map((i) => (i.productId === productId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    })),
  setDiscountPercent: (discountPercent) => set({ discountPercent }),
  setDiscountCents: (discountCents) => set({ discountCents }),
  setCoupon: (couponCode) => set({ couponCode }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCustomerId: (customerId) => set({ customerId }),
  setCashReceived: (cashReceivedCents) => set({ cashReceivedCents }),
  clear: () =>
    set({
      items: [],
      discountPercent: 0,
      discountCents: 0,
      couponCode: "",
      paymentMethod: "CASH",
      customerId: undefined,
      cashReceivedCents: 0,
    }),
  subtotalCents: () =>
    get().items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity - i.discountCents, 0),
  totalCents: () => {
    const sub = get().subtotalCents();
    const pct = Math.round(sub * (get().discountPercent / 100));
    return Math.max(0, sub - pct - get().discountCents);
  },
}));
