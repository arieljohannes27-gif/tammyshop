# Deploy TammyShop (live for everyone)

## What you get
- Public HTTPS URL (e.g. `https://tammyshop.vercel.app`)
- Hosted Postgres (Supabase)
- Phone camera works without tunnels
- Anyone can sign up and use the app

## 1. Create a free Supabase database (5 min)

1. Go to https://supabase.com → **New project**
2. Name it `tammyshop`, set a strong DB password, choose a region close to SA (e.g. `eu-west-1` or `af-south-1` if available)
3. Project Settings → **Database** → Connection string
4. Copy:
   - **Transaction pooler** URI → `DATABASE_URL` (port **6543**, add `?pgbouncer=true`)
   - **Session / direct** URI → `DIRECT_URL` (port **5432**)

## 2. Create a GitHub repo + first commit

Tell the agent: **“commit and push TammyShop to GitHub”**  
(or create an empty GitHub repo and share the URL).

## 3. Deploy on Vercel (5 min)

1. Go to https://vercel.com → **Add New Project** → Import the GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add environment variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Supabase pooler URI + `?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct URI |
| `JWT_SECRET` | Long random string (e.g. from `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL after first deploy (update once) |
| `NEXT_PUBLIC_APP_NAME` | `TammyShop` |

4. Click **Deploy**
5. After deploy succeeds, set `NEXT_PUBLIC_APP_URL` to the real `https://….vercel.app` URL and redeploy

## 4. Seed demo data (optional)

On your Mac, with production `DATABASE_URL` / `DIRECT_URL` in `.env`:

```bash
npx prisma db push
npm run db:seed
```

Or register a new owner account on the live site.

## 5. Custom domain (optional)

Vercel → Project → **Domains** → add `tammyshop.co.za` (or any domain you own).

## 6. Stripe (optional, for real payments)

Add live Stripe keys + price IDs in Vercel env. Without them, billing stays in safe “simulated” mode.

---

### Security checklist
- [ ] Strong `JWT_SECRET`
- [ ] Never commit `.env`
- [ ] Supabase password stored only in Vercel env
- [ ] HTTPS only (Vercel default)
