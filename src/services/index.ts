/**
 * Shared domain services for TammyShop Admin and future Commerce API clients.
 * Import from here in route handlers — do not duplicate Prisma logic in pages.
 */
export * from "./audit.service";
export * from "./analytics.service";
export * from "./inventory.service";
export * from "./sales.service";
export * from "./orders.service";
export * from "./catalog.service";
export * from "./pricing.service";
export * from "./customer.service";
export * from "./purchasing.service";
export * from "./billing.service";
export * from "./notification.service";
export * from "./events";
