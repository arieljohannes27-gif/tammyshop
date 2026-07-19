"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function LekkaHero({ location }: { brand: string; location: string }) {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-[92dvh] w-full overflow-hidden bg-[var(--lekka-bg-stone)]">
      <Image
        src="/brand/lekka-stop-shop-hero.png"
        alt={`Lekka Stop Shop ${location} — neighbourhood market`}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />
      {/* Soft daylight veil — keep the shop legible, avoid cinema black */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,243,236,0.22)_0%,rgba(31,28,26,0.18)_45%,rgba(31,28,26,0.42)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[92dvh] max-w-5xl flex-col justify-end px-5 pb-14 pt-28 sm:px-8 sm:pb-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg"
        >
          <p className="mb-4 text-sm font-medium text-white/90">{location}</p>
          <h1 className="lekka-display text-[2.6rem] leading-[1.1] text-white sm:text-5xl md:text-[3.4rem]">
            Your neighbourhood market, beautifully simple.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/88 sm:text-[1.05rem]">
            Fresh staples, fair prices, ready to collect — from the red shop on the corner.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/shop/products" className="lekka-btn-primary">
              Enter the market
            </Link>
            <Link
              href="/shop/products?collection=weekend-braai"
              className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-white/90 underline-offset-4 hover:underline"
            >
              Weekend braai
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
