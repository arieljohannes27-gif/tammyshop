import { prisma } from "@/lib/prisma";
import { createPayFastCheckout } from "@/lib/payfast";
import { writeAuditLog } from "@/services/audit.service";
import { emitDomainEvent } from "@/services/events";

export async function startSubscriptionCheckout(params: {
  businessId: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: "STARTER" | "ADVANCED";
}) {
  const checkout = await createPayFastCheckout({
    businessId: params.businessId,
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    plan: params.plan,
  });

  if (checkout.simulated) {
    await activateSubscription({
      businessId: params.businessId,
      userId: params.userId,
      plan: params.plan,
      simulated: true,
    });
    return { simulated: true as const, url: checkout.url };
  }

  return {
    simulated: false as const,
    action: checkout.action!,
    fields: checkout.fields!,
  };
}

export async function activateSubscription(params: {
  businessId: string;
  userId?: string;
  plan: "STARTER" | "ADVANCED";
  simulated?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const sub = await prisma.subscription.update({
    where: { businessId: params.businessId },
    data: {
      plan: params.plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelledAt: null,
      ...(params.stripeCustomerId ? { stripeCustomerId: params.stripeCustomerId } : {}),
      ...(params.stripeSubscriptionId
        ? { stripeSubscriptionId: params.stripeSubscriptionId }
        : {}),
    },
  });

  await writeAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: "BILLING",
    entityType: "subscription",
    summary: params.simulated
      ? `Activated ${params.plan} (simulated PayFast)`
      : `Activated ${params.plan} via PayFast`,
  });

  await emitDomainEvent({
    type: "subscription.activated",
    businessId: params.businessId,
    plan: params.plan,
    userId: params.userId,
  });

  return sub;
}
