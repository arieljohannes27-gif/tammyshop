# Deploy TammyShop (live + paid registrations)

People register freely → pay Starter (R50) or Advanced (R119) → then use the app.

## 1. Supabase Postgres (required)

1. Open https://supabase.com → **New project** → name `tammyshop`
2. Save the database password
3. **Project Settings → Database → Connection string**
4. Copy:
   - **Transaction pooler** (port **6543**) → `DATABASE_URL`  
     Append `?pgbouncer=true` if missing
   - **Direct / Session** (port **5432**) → `DIRECT_URL`

## 2. Stripe (required for real money)

1. Open https://dashboard.stripe.com/register (or log in)
2. Complete business details (South Africa / ZAR)
3. **Developers → API keys** → copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
4. **Product catalog → Add product** (repeat twice):

| Product | Price | Billing | Env var |
|---------|-------|---------|---------|
| TammyShop Starter | R50.00 ZAR | Monthly recurring | `STRIPE_STARTER_PRICE_ID` (`price_…`) |
| TammyShop Advanced | R119.00 ZAR | Monthly recurring | `STRIPE_ADVANCED_PRICE_ID` (`price_…`) |

5. After the site is live, **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DOMAIN/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

Use **Test mode** first (card `4242 4242 4242 4242`). Switch to Live keys when ready for real payments.

## 3. Push code to GitHub

Repo: https://github.com/arieljohannes27-gif/tammyshop

## 4. Deploy on Vercel

1. https://vercel.com → **Add New Project** → import `tammyshop`
2. Framework: **Next.js**
3. Environment variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Supabase pooler URI + `?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct URI |
| `JWT_SECRET` | Long random hex (e.g. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (set after first deploy) |
| `NEXT_PUBLIC_APP_NAME` | `TammyShop` |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_STARTER_PRICE_ID` | `price_…` for R50 |
| `STRIPE_ADVANCED_PRICE_ID` | `price_…` for R119 |
| `STRIPE_WEBHOOK_SECRET` | From webhook (after URL exists) |

4. **Deploy**
5. Set `NEXT_PUBLIC_APP_URL` to `https://….vercel.app` and redeploy
6. Add the Stripe webhook (step 2.5) pointing at that URL

## 5. Create production database tables

With production URLs in a local `.env.production.local` (or temporarily in `.env`):

```bash
npx prisma db push
# optional demo shop:
npm run db:seed
```

Or skip seed and let real customers register + pay.

## 6. Smoke test

1. Open the live site → **Register** (new email)
2. Choose Starter or Advanced → pay with Stripe test card
3. Confirm you land in the dashboard
4. Log out → try accessing `/dashboard` without paying (should hit `/subscribe`)

---

### Security
- Never commit `.env`
- Strong `JWT_SECRET` in production
- Prefer Stripe **Live** keys only after testing
- HTTPS only (Vercel default)
