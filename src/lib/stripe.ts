import Stripe from "stripe";
import { PRICING } from "@/types";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

export const STRIPE_PLANS = {
  STARTER: {
    name: "Starter",
    amountZar: PRICING.STARTER.monthlyZar,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
  },
  ADVANCED: {
    name: "Advanced",
    amountZar: PRICING.ADVANCED.monthlyZar,
    priceId: process.env.STRIPE_ADVANCED_PRICE_ID || "",
  },
} as const;

export async function createCheckoutSession(params: {
  businessId: string;
  email: string;
  plan: "STARTER" | "ADVANCED";
  customerId?: string | null;
}) {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const planConfig = STRIPE_PLANS[params.plan];

  if (!stripe || !planConfig.priceId) {
    return {
      simulated: true as const,
      url: `${appUrl}/billing/success?plan=${params.plan}&simulated=1`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId || undefined,
    customer_email: params.customerId ? undefined : params.email,
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings/billing?cancelled=1`,
    metadata: {
      businessId: params.businessId,
      plan: params.plan,
    },
  });

  return { simulated: false as const, url: session.url!, sessionId: session.id };
}
