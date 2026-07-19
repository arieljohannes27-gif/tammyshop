# Phase 4 — Lekka Stop Shop storefront

Customer-facing premium neighbourhood market at **`/shop`**, powered by Phase 2/3 shared services (same Supabase DB). TammyShop Admin and SaaS marketing at `/` are unchanged.

## Design

- Language: `docs/LEKKA-STOP-SHOP-DESIGN.md`
- Tokens: `src/styles/lekka-tokens.css` (scoped `.lekka`)
- Hero: `public/brand/lekka-stop-shop-hero.png`

## Routes

| Path | Purpose |
|------|---------|
| `/shop` | Full-bleed hero + fresh picks |
| `/shop/products` | Catalogue, search `?q=`, category filter |
| `/shop/products/[id]` | Product detail |
| `/shop/cart` | Bag |
| `/shop/checkout` | Details + place order |
| `/shop/order/[id]` | Confirmation |
| `POST /api/storefront/checkout` | Public checkout → `createOnlineOrder` |

## Config

| Env | Default |
|-----|---------|
| `STOREFRONT_BUSINESS_ID` | — (preferred in prod) |
| `STOREFRONT_BUSINESS_SLUG` | `lekkerstopshop` |
| `NEXT_PUBLIC_STOREFRONT_NAME` | `Lekka Stop Shop` |
| `NEXT_PUBLIC_STOREFRONT_LOCATION` | `Westridge` |

Stock and prices come from that business’s Admin catalogue. Checkout creates `Order` (ONLINE / CONFIRMED), decrements stock, pay-on-collection for now.

## Compatibility

- Does not replace TammyShop marketing `/`
- Commerce API `/api/v1` still available for external clients
- Cart persisted in browser (`lekka-cart-v1`)

## Next

Phase 5+ — delivery, driver, PayFast customer payments, multi-store.
