# TammyShop

**Simple. Smart. Stock Control.**

Production-ready inventory, POS, purchasing and analytics SaaS for spaza shops, tuck shops, mini markets and retailers.

## Stack

- Next.js 15 · React 19 · TypeScript · Tailwind CSS 4
- Prisma · PostgreSQL (local Docker or Supabase)
- Supabase-ready auth/client helpers
- Stripe subscriptions (Starter R50 / Advanced R119)
- TanStack Query · Zustand · Framer Motion · Recharts

## Quick start

```bash
# 1. Database
docker compose up -d

# 2. Environment
cp .env.example .env

# 3. Install, migrate, seed
npm install
npm run db:push
npm run db:seed

# 4. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo login

| | |
|---|---|
| Email | `demo@tammyshop.co.za` |
| Password | `demo1234` |
| Plan | Advanced (seeded) |

Also seeded: `manager@tammyshop.co.za` and `staff@tammyshop.co.za` (same password).

## Features

- Landing page, auth (login/register/forgot/reset/verify), role-based access (Owner / Manager / Employee)
- Monday-style dashboard with KPIs, charts and activity
- Inventory (products, categories, brands, CSV import/export, archive/duplicate)
- Modern POS (search, barcode, cart, discounts, coupons, cash/card/EFT/split, receipts, refunds)
- Purchases, suppliers, customers, stock movements with audit logs
- AI analytics, shopping lists, reports (CSV/JSON/print)
- Global search, notifications, settings, dark mode
- Stripe checkout (real when keys set; simulated otherwise)

## Supabase

1. Create a Supabase project
2. Set `DATABASE_URL` to the Postgres connection string
3. Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional client)
4. Run `npm run db:push` or apply `supabase/migrations/`

## Stripe

Set in `.env`:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_ADVANCED_PRICE_ID`

Without keys, billing uses a safe simulated activation path for local development.

## Architecture

```
src/
  app/            # Marketing, auth, app routes + API
  components/     # UI kit, layout, charts
  features/       # Feature modules
  services/       # Domain services (analytics, inventory, audit)
  stores/         # Zustand stores (POS)
  types/          # Shared TypeScript contracts
  lib/            # Auth, prisma, stripe, supabase, utils
prisma/           # Schema + seed
supabase/         # SQL migrations
```

## Deploy (Vercel)

1. Push repo to GitHub
2. Import on Vercel
3. Set env vars (DATABASE_URL, JWT_SECRET, Stripe, Supabase)
4. Deploy
