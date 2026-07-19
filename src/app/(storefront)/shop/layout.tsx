import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { LekkaFooter } from "@/components/lekka/LekkaFooter";
import { LekkaNav } from "@/components/lekka/LekkaNav";
import { storefrontBrandName, storefrontLocation } from "@/lib/storefront";
import "@/styles/lekka-tokens.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-lekka-sans-loaded",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-lekka-display-loaded",
});

export const metadata: Metadata = {
  title: {
    default: "Lekka Stop Shop",
    template: "%s · Lekka Stop Shop",
  },
  description:
    "Lekka Stop Shop — a premium neighbourhood market in Westridge. Fresh, fair, ready to collect.",
};

export default function LekkaShopLayout({ children }: { children: React.ReactNode }) {
  const brand = storefrontBrandName();
  const location = storefrontLocation();

  return (
    <div
      className={`lekka flex min-h-dvh flex-col ${dmSans.variable} ${fraunces.variable}`}
      style={
        {
          "--font-lekka-sans": "var(--font-lekka-sans-loaded), ui-sans-serif, system-ui, sans-serif",
          "--font-lekka-display": "var(--font-lekka-display-loaded), Georgia, serif",
        } as CSSProperties
      }
    >
      <LekkaNav brand={brand} location={location} />
      <main className="flex-1">{children}</main>
      <LekkaFooter brand={brand} location={location} />
    </div>
  );
}
