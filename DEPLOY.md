# Deploy TammyShop (live + paid registrations via PayFast)

People register freely → pay Starter (R50) or Advanced (R119) on PayFast → then use the app.

## 1. Supabase Postgres (required)

Already done if you pushed the schema. Need:

- `DATABASE_URL` — pooler port **6543** + `?pgbouncer=true`
- `DIRECT_URL` — session/direct port **5432**

## 2. PayFast (South Africa payments)

1. Open https://www.payfast.co.za/ → register a merchant account  
   (For testing first: https://sandbox.payfast.co.za/)
2. Dashboard → copy:
   - Merchant ID → `PAYFAST_MERCHANT_ID`
   - Merchant Key → `PAYFAST_MERCHANT_KEY`
3. Settings → set a **Salt Passphrase** → `PAYFAST_PASSPHRASE` (required for subscriptions)
4. After the site is live, set notify URL (or we send it per checkout):
   - `https://YOUR-DOMAIN/api/billing/webhook`

Env:

| Name | Value |
|------|--------|
| `PAYFAST_MERCHANT_ID` | from dashboard |
| `PAYFAST_MERCHANT_KEY` | from dashboard |
| `PAYFAST_PASSPHRASE` | salt passphrase |
| `PAYFAST_SANDBOX` | `true` for sandbox, `false` for live |

Without these, checkout stays in **demo/simulated** mode (unlocks plan without real payment).

## 3. Deploy on Vercel

1. https://vercel.com → import GitHub repo `tammyshop`
2. Add env vars:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Supabase pooler URI |
| `DIRECT_URL` | Supabase direct URI |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://….vercel.app` (set after first deploy) |
| `NEXT_PUBLIC_APP_NAME` | `TammyShop` |
| `PAYFAST_MERCHANT_ID` | … |
| `PAYFAST_MERCHANT_KEY` | … |
| `PAYFAST_PASSPHRASE` | … |
| `PAYFAST_SANDBOX` | `true` then later `false` |

3. Deploy → update `NEXT_PUBLIC_APP_URL` → redeploy

## 4. Smoke test

1. Register a new shop
2. Choose Starter → PayFast checkout
3. Pay (sandbox test card / process)
4. Confirm dashboard unlocks

---

### Security
- Never commit `.env` / `.env.production.local`
- Strong `JWT_SECRET`
- Use sandbox until live PayFast account is verified
