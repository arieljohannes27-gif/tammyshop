# Phase 2 — Shared Services

## What shipped
Domain logic moved behind reusable services used by Admin APIs (and ready for Commerce API):

| Service | Responsibility |
|---------|----------------|
| `catalog.service` | Products, categories, brands |
| `pricing.service` | Margins, coupons, product price lookup |
| `customer.service` | Customer list/create |
| `sales.service` / `orders.service` | POS sale/refund (order channel bridge) |
| `inventory.service` | Stock ledger (+ tx-aware) |
| `purchasing.service` | Atomic PO receive |
| `billing.service` | PayFast checkout + subscription activate |
| `notification.service` | Notifications + domain-event listeners |
| `events.ts` | In-process domain event bus |

## Compatibility
- Existing `/api/*` routes kept; handlers are thin wrappers
- Same response shapes for the Admin UI
- Large-sale notifications now fire via `sale.completed` events

## Next
Phase 3 — versioned Commerce API (`/api/v1`) consuming these services.
