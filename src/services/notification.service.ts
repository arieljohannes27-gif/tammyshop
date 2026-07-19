import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { onDomainEvent } from "@/services/events";

export async function createNotification(params: {
  businessId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId?: string | null;
}) {
  return prisma.notification.create({
    data: {
      businessId: params.businessId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      userId: params.userId ?? undefined,
    },
  });
}

export async function listNotifications(params: {
  businessId: string;
  userId: string;
  limit?: number;
}) {
  return prisma.notification.findMany({
    where: {
      businessId: params.businessId,
      OR: [{ userId: null }, { userId: params.userId }],
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function markNotificationsRead(params: {
  businessId: string;
  id?: string;
  markAll?: boolean;
}) {
  if (params.markAll) {
    await prisma.notification.updateMany({
      where: { businessId: params.businessId, isRead: false },
      data: { isRead: true },
    });
    return;
  }
  if (params.id) {
    await prisma.notification.updateMany({
      where: { id: params.id, businessId: params.businessId },
      data: { isRead: true },
    });
  }
}

/** Side-effect listeners for domain events (idempotent registration). */
let wired = false;
export function wireNotificationListeners() {
  if (wired) return;
  wired = true;

  onDomainEvent(async (event) => {
    if (event.type === "sale.completed") {
      const settings = await prisma.businessSetting.findUnique({
        where: { businessId: event.businessId },
      });
      if (settings && event.totalCents >= settings.largeSaleThresholdCents) {
        await createNotification({
          businessId: event.businessId,
          type: "LARGE_SALE",
          title: "Large sale recorded",
          message: `${event.invoiceNumber} for R${(event.totalCents / 100).toFixed(2)}`,
          link: `/sales/${event.saleId}`,
        });
      }
    }

    if (event.type === "subscription.activated") {
      await createNotification({
        businessId: event.businessId,
        type: "SYSTEM",
        title: "Subscription active",
        message: `${event.plan} plan is now active`,
        link: "/settings/billing",
        userId: event.userId,
      });
    }
  });
}

wireNotificationListeners();
