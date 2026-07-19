/**
 * Editorial market collections — content/IA for the storefront redesign.
 * Not a new commerce feature; curates existing catalogue into appetite-led aisles.
 */

export type LekkaCollection = {
  id: string;
  title: string;
  eyebrow: string;
  blurb: string;
  /** Keywords matched against product name (case-insensitive) */
  match: string[];
  lifestyleImage: string;
  lifestyleAlt: string;
};

export const LEKKA_COLLECTIONS: LekkaCollection[] = [
  {
    id: "fresh-this-week",
    title: "Fresh this week",
    eyebrow: "From the crates",
    blurb: "What we’d put on the table tonight — bright, simple, neighbourhood-good.",
    match: ["banana", "milk", "bread", "egg"],
    lifestyleImage:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
    lifestyleAlt: "Fresh market produce in natural light",
  },
  {
    id: "weekend-braai",
    title: "Weekend braai",
    eyebrow: "For the fire",
    blurb: "The easy companions for golden hour — cold drinks, crisps, and good company.",
    match: ["coke", "cola", "chips", "oil"],
    lifestyleImage:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80",
    lifestyleAlt: "Friends sharing food outdoors at golden hour",
  },
  {
    id: "baked-this-morning",
    title: "Baked this morning",
    eyebrow: "Warm from the shelf",
    blurb: "Soft loaves and the smell of a proper start to the day.",
    match: ["bread", "coffee"],
    lifestyleImage:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80",
    lifestyleAlt: "Freshly baked bread on a wooden board",
  },
  {
    id: "farm-fresh",
    title: "Farm fresh",
    eyebrow: "Quiet quality",
    blurb: "Dairy, eggs, and the ingredients that make a kitchen feel looked after.",
    match: ["egg", "milk", "banana"],
    lifestyleImage:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1600&q=80",
    lifestyleAlt: "Farm-fresh breakfast ingredients in soft morning light",
  },
  {
    id: "daily-essentials",
    title: "Daily essentials",
    eyebrow: "Always on hand",
    blurb: "The reliable staples — affordable, ready to collect when you need them.",
    match: ["oil", "coffee", "milk", "bread"],
    lifestyleImage:
      "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1600&q=80",
    lifestyleAlt: "Simple kitchen staples arranged with care",
  },
];

/** Lifestyle stills when a product has no uploaded image — never letter monograms. */
const PRODUCT_STILLS: { match: string; url: string }[] = [
  {
    match: "chip",
    url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "coke",
    url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "cola",
    url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "milk",
    url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "bread",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "egg",
    url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "banana",
    url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "oil",
    url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: "coffee",
    url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
  },
];

const DEFAULT_STILL =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80";

export function resolveProductImage(name: string, imageUrl?: string | null) {
  if (imageUrl) return imageUrl;
  const lower = name.toLowerCase();
  const hit = PRODUCT_STILLS.find((s) => lower.includes(s.match));
  return hit?.url ?? DEFAULT_STILL;
}

export function productsForCollection<T extends { name: string }>(
  collection: LekkaCollection,
  products: T[],
  limit = 4,
) {
  const matched = products.filter((p) => {
    const lower = p.name.toLowerCase();
    return collection.match.some((m) => lower.includes(m.toLowerCase()));
  });
  if (matched.length >= 2) return matched.slice(0, limit);
  return products.slice(0, limit);
}
