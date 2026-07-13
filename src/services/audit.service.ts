import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

export async function writeAuditLog(params: {
  businessId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      businessId: params.businessId,
      userId: params.userId ?? undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      summary: params.summary,
      metadata: params.metadata as object | undefined,
    },
  });
}
