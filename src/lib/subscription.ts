import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type SubscriptionSnapshot = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

/** Paid access: Starter or Advanced with an active (or valid trial) subscription. */
export function hasPaidAccess(sub: SubscriptionSnapshot | null | undefined): boolean {
  if (!sub) return false;
  if (sub.plan !== "STARTER" && sub.plan !== "ADVANCED") return false;

  if (sub.status === "ACTIVE") {
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return false;
    return true;
  }

  if (sub.status === "TRIALING") {
    if (sub.trialEndsAt && sub.trialEndsAt < new Date()) return false;
    return true;
  }

  return false;
}

export async function getSubscription(businessId: string) {
  return prisma.subscription.findUnique({ where: { businessId } });
}

export async function businessHasPaidAccess(businessId: string): Promise<boolean> {
  const sub = await getSubscription(businessId);
  return hasPaidAccess(sub);
}

export async function businessIsApproved(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { approvalStatus: true },
  });
  return business?.approvalStatus === "APPROVED";
}
