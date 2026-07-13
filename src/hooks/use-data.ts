"use client";

import { useQuery } from "@tanstack/react-query";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });
}

export function useProducts(q = "") {
  return useQuery({
    queryKey: ["products", q],
    queryFn: async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });
}
