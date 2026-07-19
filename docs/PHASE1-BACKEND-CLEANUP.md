# Phase 1 — Backend cleanup (Commerce Engine)

## Goals (completed in code)
- Align Supabase SQL migration with Prisma (`20260719_phase1_backend_cleanup.sql`)
- Atomic POS sale + stock + invoice sequence (`sales.service` + `nextInvoiceNumber`)
- Server-side product pricing (ignore client unit/cost prices)
- Coupon validation against `coupons` table
- Role permissions via `requirePaidPermission`
- Harden middleware JWT (no prod `dev-secret` fallback)
- Remove unused Stripe package / `lib/stripe.ts` / unused hooks

## Deploy notes
1. `npx prisma db push` (or apply the SQL migration on Supabase)
2. Redeploy Vercel
3. Smoke-test: login → POS sale → stock decreases → refund restores stock

## Compatibility
- Existing routes preserved
- PayFast IDs still stored in `stripe_*` columns (documented, not renamed yet)
- TammyShop Admin remains the only UI client
