# Phase 3 — Commerce API

Versioned commerce surface for Lekka Stop Shop and integrations, on the same Supabase database. POS `Sale` is unchanged.

## Auth

| Method | How |
|--------|-----|
| API key | `X-Api-Key: tsk_live_…` or `Authorization: Bearer tsk_live_…` |
| Admin session | Cookie session (owner/manager) — full scopes (`*`) |

Business must be **approved** and **paid** (same gates as Admin app).

### Scopes
- `catalog:read`
- `orders:read`
- `orders:write`

Create/list/revoke keys (Admin session, owner/manager):

```http
POST /api/settings/api-keys
{ "name": "Lekka Stop Shop", "scopes": ["catalog:read","orders:read","orders:write"] }
```

Response includes `secret` **once** — store it securely.

## Endpoints

| Method | Path | Scope |
|--------|------|-------|
| GET | `/api/v1/catalog/products?q=` | `catalog:read` |
| GET | `/api/v1/catalog/products/:id` | `catalog:read` |
| POST | `/api/v1/checkout` | `orders:write` |
| GET | `/api/v1/orders` | `orders:read` |
| GET | `/api/v1/orders/:id` | `orders:read` |
| GET | `/api/v1/openapi.json` | (public OpenAPI doc) |

### Checkout

- Server-side product pricing from catalog
- Optional `Idempotency-Key` header (per business); same key + same payload → replay `200`; same key + different payload → `409`
- Creates `Order` (`ONLINE`, `CONFIRMED`), decrements stock via shared inventory ledger
- COD-style confirmation (customer PayFast comes in Phase 4)

Example:

```bash
curl -sS -X POST "$BASE/api/v1/checkout" \
  -H "X-Api-Key: $TSK_KEY" \
  -H "Idempotency-Key: cart-abc-001" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<uuid>","quantity":2}],"customerEmail":"buyer@example.com"}'
```

## Schema (additive)

- `ApiKey` — hashed secrets, scopes, revoke
- `Order` / `OrderItem` — channel, status, idempotency
- `Business.nextOrderNumber` — `ORD-000001` sequence

Migration: `supabase/migrations/20260719_phase3_commerce_api.sql`

## Compatibility

- Existing Admin `/api/*` routes untouched
- Shared services from Phase 2 used for catalog + stock
- Domain event: `order.created`

## Next

Phase 4 — Lekka Stop Shop storefront consuming `/api/v1`.
