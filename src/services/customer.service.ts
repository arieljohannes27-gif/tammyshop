import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/audit.service";
import { emitDomainEvent } from "@/services/events";

export async function listCustomers(params: { businessId: string; q?: string }) {
  return prisma.customer.findMany({
    where: {
      businessId: params.businessId,
      deletedAt: null,
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" as const } },
              { phone: { contains: params.q } },
              { email: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(businessId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, businessId, deletedAt: null },
    include: {
      sales: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function createCustomer(params: {
  businessId: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  const customer = await prisma.customer.create({
    data: {
      businessId: params.businessId,
      name: params.name,
      email: params.email || null,
      phone: params.phone,
      address: params.address,
      notes: params.notes,
    },
  });

  await writeAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: "CREATE",
    entityType: "customer",
    entityId: customer.id,
    summary: `Added customer ${customer.name}`,
  });
  await emitDomainEvent({
    type: "customer.created",
    businessId: params.businessId,
    customerId: customer.id,
    userId: params.userId,
  });
  return customer;
}
