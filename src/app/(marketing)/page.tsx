"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Package,
  ShoppingCart,
  Sparkles,
  Shield,
  Truck,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui";

const features = [
  {
    icon: Package,
    title: "Inventory that stays accurate",
    desc: "Track products, barcodes, batches, expiry and stock locations without spreadsheets.",
  },
  {
    icon: ShoppingCart,
    title: "Modern POS in minutes",
    desc: "Scan, sell, split payments, print receipts and process refunds from one clean screen.",
  },
  {
    icon: Truck,
    title: "Purchases & suppliers",
    desc: "Raise purchase orders, receive stock and keep supplier balances under control.",
  },
  {
    icon: Sparkles,
    title: "AI stock intelligence",
    desc: "Spot fast movers, dead stock, reorder points and generate smart shopping lists.",
  },
  {
    icon: BarChart3,
    title: "Reports owners trust",
    desc: "Sales, profit, tax, inventory health and supplier reports — export PDF, Excel or CSV.",
  },
  {
    icon: Shield,
    title: "Roles & audit trails",
    desc: "Owner, manager and employee permissions with a full audit log on every stock move.",
  },
];

const steps = [
  { title: "Create your shop", desc: "Sign up, add your business details and invite your team." },
  { title: "Add products", desc: "Import CSV, scan barcodes or create products in seconds." },
  { title: "Sell & restock", desc: "Use POS daily. TammyShop tells you what to buy next." },
];

const faqs = [
  {
    q: "Is TammyShop built for spaza shops?",
    a: "Yes. It is designed for spaza shops, tuck shops, mini markets and small retailers who need simple stock control.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Absolutely. TammyShop is fully responsive and works on desktop, tablet and mobile browsers.",
  },
  {
    q: "What does Advanced unlock?",
    a: "AI shopping lists, supplier management, purchase orders, forecasts, profit analytics and priority support.",
  },
  {
    q: "Do you support South African Rand?",
    a: "Yes. ZAR is the default currency with VAT-ready reporting.",
  },
];

function AnimatedPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative mx-auto w-full max-w-5xl"
    >
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-r from-primary/30 via-accent/20 to-secondary/30 blur-2xl" />
      <Card elevated glass className="relative overflow-hidden p-0">
        <div className="border-b border-border/70 bg-white/50 px-5 py-3 dark:bg-black/20">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
            <span className="ml-3 text-xs text-text-muted">TammyShop Dashboard</span>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-4">
          {[
            ["Stock Value", "R 184,250"],
            ["Today's Sales", "R 6,840"],
            ["Profit", "R 42,110"],
            ["Health Score", "92"],
          ].map(([label, value], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-white p-4 dark:bg-surface"
            >
              <p className="label-caps">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </motion.div>
          ))}
        </div>
        <div className="grid gap-4 px-5 pb-5 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-transparent p-4 md:col-span-2">
            <p className="label-caps mb-4">Revenue</p>
            <div className="flex h-36 items-end gap-2">
              {[40, 55, 48, 70, 62, 88, 76, 95, 84, 100, 92, 110].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.4 + i * 0.04, type: "spring", stiffness: 120 }}
                  className="flex-1 rounded-t-lg bg-primary/80"
                />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white p-4 dark:bg-surface">
            <p className="label-caps mb-3">Fast movers</p>
            {["Coca-Cola 2L", "White Bread", "Milk 2L", "Rice 2kg"].map((p) => (
              <div key={p} className="mb-2 flex items-center justify-between text-sm">
                <span>{p}</span>
                <Badge tone="accent">↑</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/70 backdrop-blur-xl dark:bg-surface/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
              T
            </div>
            <div>
              <p className="text-lg font-bold leading-none">TammyShop</p>
              <p className="text-[11px] text-text-muted">Simple. Smart. Stock Control.</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary md:flex">
            <a href="#features" className="hover:text-text">Features</a>
            <a href="#how" className="hover:text-text">How it works</a>
            <a href="#pricing" className="hover:text-text">Pricing</a>
            <a href="#faq" className="hover:text-text">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="gradient-hero overflow-hidden px-4 pb-16 pt-14 md:pt-20">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Badge tone="primary" className="mb-5">Built for South African retailers</Badge>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-text md:text-6xl">
              TammyShop
            </h1>
            <p className="mt-3 text-xl font-semibold text-primary md:text-2xl">Simple. Smart. Stock Control.</p>
            <p className="mx-auto mt-5 max-w-2xl text-base text-text-secondary md:text-lg">
              Inventory, sales, suppliers and purchasing in one premium dashboard — simple enough for any shop
              owner to use in five minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gradient-cta border-0">
                  Start for R50/mo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="secondary">
                  View pricing
                </Button>
              </a>
            </div>
          </motion.div>
          <div className="mt-14">
            <AnimatedPreview />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="label-caps text-primary">Features</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Everything your shop needs</h2>
          <p className="mt-3 text-text-secondary">
            A Monday.com-inspired workspace with the clarity of Stripe and the practicality of Square POS.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card elevated className="h-full hover:-translate-y-1 transition">
                <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-white py-20 dark:bg-surface">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="label-caps text-accent">How it works</p>
            <h2 className="mt-2 text-3xl font-bold">Up and running in three steps</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Card key={s.title} elevated>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-10 text-center">
          <p className="label-caps text-primary">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold">Simple plans for growing shops</h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <Card elevated className="relative">
            <Badge>Starter</Badge>
            <p className="mt-4 text-4xl font-extrabold">
              R50<span className="text-base font-medium text-text-secondary">/month</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Inventory & Dashboard",
                "Sales / POS",
                "Reports",
                "Unlimited Products",
                "Barcode Support",
                "Basic Analytics",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=STARTER" className="mt-8 block">
              <Button className="w-full" variant="secondary">
                Choose Starter
              </Button>
            </Link>
          </Card>
          <Card elevated className="relative border-primary/40 ring-2 ring-primary/20">
            <div className="absolute right-4 top-4">
              <Badge tone="accent">Most popular</Badge>
            </div>
            <Badge tone="primary">Advanced</Badge>
            <p className="mt-4 text-4xl font-extrabold">
              R119<span className="text-base font-medium text-text-secondary">/month</span>
            </p>
            <p className="mt-2 text-sm text-text-secondary">Everything in Starter, plus:</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "AI Shopping List",
                "Printable Shopping List",
                "Supplier Management",
                "Purchase Orders",
                "Sales Forecast",
                "Profit Analytics",
                "Fast / Slow / Dead Stock",
                "Monthly Reports",
                "Priority Support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=ADVANCED" className="mt-8 block">
              <Button className="w-full">Choose Advanced</Button>
            </Link>
          </Card>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-surface">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="label-caps">Testimonials</p>
            <h2 className="mt-2 text-3xl font-bold">Loved by shop owners</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                quote: "I finally know what to reorder before I run out. TammyShop paid for itself in a week.",
                name: "Thandi M.",
                role: "Spaza owner, Soweto",
              },
              {
                quote: "The POS is faster than our old till. Staff learned it in one afternoon.",
                name: "Ravi P.",
                role: "Mini market, Durban",
              },
              {
                quote: "Dead stock detection alone saved us thousands. Clean, premium and simple.",
                name: "Lerato K.",
                role: "Tuck shop, Pretoria",
              },
            ].map((t) => (
              <Card key={t.name} elevated>
                <Zap className="mb-3 h-5 w-5 text-warning" />
                <p className="text-sm leading-relaxed text-text-secondary">“{t.quote}”</p>
                <p className="mt-4 text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-text-muted">{t.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">FAQ</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Card key={f.q} className="p-0 overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {f.q}
                <ChevronDown className={`h-4 w-4 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i ? <p className="px-5 pb-4 text-sm text-text-secondary">{f.a}</p> : null}
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-white py-12 dark:bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold">TammyShop</p>
            <p className="text-sm text-text-secondary">Simple. Smart. Stock Control.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <Link href="/login">Login</Link>
            <Link href="/register">Sign Up</Link>
            <a href="#pricing">Pricing</a>
            <a href="#features">Features</a>
          </div>
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} TammyShop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
