"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function LekkaHero({ brand, location }: { brand: string; location: string }) {
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      <Image
        src="/brand/lekka-stop-shop-hero.png"
        alt={`${brand} ${location} — neighbourhood market`}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/15" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            {location}
          </p>
          <h1
            className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
          >
            {brand}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
            A calm neighbourhood market — fresh, trusted, and easy to order.
          </p>
          <div className="mt-8">
            <Link
              href="/shop/products"
              className="lekka-btn-primary shadow-lg shadow-black/20"
            >
              Shop the market
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
