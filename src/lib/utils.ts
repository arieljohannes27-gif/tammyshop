import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number | bigint, currency = "ZAR") {
  const value = Number(cents) / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatRand(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCents(cents: number | bigint) {
  return formatCurrency(cents);
}

export function parseRandToCents(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = Number.parseFloat(cleaned);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function calcMarkup(costCents: number, sellCents: number) {
  if (costCents <= 0) return 0;
  return ((sellCents - costCents) / costCents) * 100;
}

export function calcProfit(costCents: number, sellCents: number, qty = 1) {
  return (sellCents - costCents) * qty;
}

export function calcGrossMargin(costCents: number, sellCents: number) {
  if (sellCents <= 0) return 0;
  return ((sellCents - costCents) / sellCents) * 100;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSku(name: string, prefix = "TM") {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${base || "PROD"}-${rand}`;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
