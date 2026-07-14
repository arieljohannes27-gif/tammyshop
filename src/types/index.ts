export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE";
export type SubscriptionPlan = "FREE" | "STARTER" | "ADVANCED";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
export type PaymentMethod = "CASH" | "CARD" | "EFT" | "SPLIT" | "OTHER";
export type SaleStatus = "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "VOIDED";
export type PurchaseOrderStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED";
export type StockMovementType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "SALE"
  | "RETURN"
  | "DAMAGED"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "PURCHASE";

export interface SessionUser {
  id: string;
  businessId: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface SessionPayload {
  sessionId: string;
  userId: string;
  businessId: string;
  role: UserRole;
  email: string;
  fullName: string;
  isPlatformAdmin?: boolean;
}

export interface PlanFeatures {
  plan: SubscriptionPlan;
  maxProducts: number | null;
  inventory: boolean;
  dashboard: boolean;
  sales: boolean;
  reports: boolean;
  barcode: boolean;
  basicAnalytics: boolean;
  aiShoppingList: boolean;
  printableShoppingList: boolean;
  suppliers: boolean;
  purchaseOrders: boolean;
  salesForecast: boolean;
  profitAnalytics: boolean;
  stockMovementAnalysis: boolean;
  monthlyReports: boolean;
  prioritySupport: boolean;
  customers: boolean;
  multiUser: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  FREE: {
    plan: "FREE",
    maxProducts: 30,
    inventory: true,
    dashboard: true,
    sales: true,
    reports: false,
    barcode: true,
    basicAnalytics: false,
    aiShoppingList: false,
    printableShoppingList: false,
    suppliers: false,
    purchaseOrders: false,
    salesForecast: false,
    profitAnalytics: false,
    stockMovementAnalysis: false,
    monthlyReports: false,
    prioritySupport: false,
    customers: true,
    multiUser: false,
  },
  STARTER: {
    plan: "STARTER",
    maxProducts: null,
    inventory: true,
    dashboard: true,
    sales: true,
    reports: true,
    barcode: true,
    basicAnalytics: true,
    aiShoppingList: false,
    printableShoppingList: false,
    suppliers: false,
    purchaseOrders: false,
    salesForecast: false,
    profitAnalytics: false,
    stockMovementAnalysis: false,
    monthlyReports: false,
    prioritySupport: false,
    customers: true,
    multiUser: true,
  },
  ADVANCED: {
    plan: "ADVANCED",
    maxProducts: null,
    inventory: true,
    dashboard: true,
    sales: true,
    reports: true,
    barcode: true,
    basicAnalytics: true,
    aiShoppingList: true,
    printableShoppingList: true,
    suppliers: true,
    purchaseOrders: true,
    salesForecast: true,
    profitAnalytics: true,
    stockMovementAnalysis: true,
    monthlyReports: true,
    prioritySupport: true,
    customers: true,
    multiUser: true,
  },
};

export const PRICING = {
  STARTER: { monthlyZar: 50, label: "Starter" },
  ADVANCED: { monthlyZar: 119, label: "Advanced" },
} as const;

export interface DashboardKpis {
  totalStockValueCents: number;
  todaySalesCents: number;
  monthlySalesCents: number;
  profitCents: number;
  grossMarginPercent: number;
  inventoryValueCents: number;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  ordersPending: number;
  purchasesCount: number;
  inventoryHealthScore: number;
  businessHealthScore: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface ProductAnalyticsItem {
  id: string;
  name: string;
  quantity: number;
  soldQty: number;
  revenueCents: number;
  profitCents: number;
  turnover: number;
  daysOfStock: number | null;
  status: "fast" | "slow" | "dead" | "healthy" | "overstocked" | "reorder";
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  quantity: number;
  unitPriceCents: number;
  costPriceCents: number;
  discountCents: number;
}

export interface GlobalSearchResult {
  type: "product" | "customer" | "sale" | "supplier" | "purchase" | "invoice";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}
