/**
 * Lightweight in-process domain events for shared services.
 * Phase 3 Commerce API can swap this for a queue without changing emitters.
 */

export type DomainEvent =
  | { type: "product.created"; businessId: string; productId: string; userId?: string }
  | { type: "product.updated"; businessId: string; productId: string; userId?: string }
  | { type: "product.deleted"; businessId: string; productId: string; userId?: string }
  | { type: "sale.completed"; businessId: string; saleId: string; totalCents: number; invoiceNumber: string; userId?: string }
  | { type: "sale.refunded"; businessId: string; saleId: string; userId?: string }
  | { type: "stock.changed"; businessId: string; productId: string; quantityAfter: number }
  | { type: "purchase.received"; businessId: string; purchaseOrderId: string; orderNumber: string; userId?: string }
  | { type: "customer.created"; businessId: string; customerId: string; userId?: string }
  | { type: "subscription.activated"; businessId: string; plan: string; userId?: string }
  | { type: "order.created"; businessId: string; orderId: string; orderNumber: string; userId?: string };

type Handler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Set<Handler>();

export function onDomainEvent(handler: Handler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export async function emitDomainEvent(event: DomainEvent) {
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (e) {
      console.error("[domain-event]", event.type, e);
    }
  }
}
