import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { generateSku } from "@/lib/utils";
import { writeAuditLog } from "@/services/audit.service";
import { emitDomainEvent } from "@/services/events";

function serializeProduct<T extends { quantity: Decimal; minStock: Decimal; maxStock: Decimal | null }>(p: T) {
  return {
    ...p,
    quantity: Number(p.quantity),
    minStock: Number(p.minStock),
    maxStock: p.maxStock != null ? Number(p.maxStock) : null,
  };
}

export async function listProducts(params: {
  businessId: string;
  q?: string;
  includeArchived?: boolean;
}) {
  const products = await prisma.product.findMany({
    where: {
      businessId: params.businessId,
      deletedAt: null,
      ...(params.includeArchived ? {} : { isArchived: false }),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" as const } },
              { sku: { contains: params.q, mode: "insensitive" as const } },
              { barcode: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { category: true, brand: true, unit: true, supplier: true },
    orderBy: { name: "asc" },
  });
  return products.map(serializeProduct);
}

export async function getProduct(businessId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, businessId, deletedAt: null },
    include: {
      category: true,
      brand: true,
      unit: true,
      supplier: true,
      stockMovements: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!product) return null;
  return {
    ...serializeProduct(product),
    stockMovements: product.stockMovements.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
      quantityAfter: Number(m.quantityAfter),
    })),
  };
}

export type CreateProductInput = {
  businessId: string;
  userId: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  supplierId?: string | null;
  costPriceCents: number;
  sellPriceCents: number;
  quantity?: number;
  minStock?: number;
  maxStock?: number | null;
  location?: string;
  expiryDate?: string | null;
  batchNumber?: string;
  notes?: string;
  imageUrl?: string;
  vatInclusive?: boolean;
};

export async function createProduct(input: CreateProductInput) {
  const product = await prisma.product.create({
    data: {
      businessId: input.businessId,
      name: input.name,
      description: input.description,
      sku: input.sku || generateSku(input.name),
      barcode: input.barcode || null,
      categoryId: input.categoryId || null,
      brandId: input.brandId || null,
      unitId: input.unitId || null,
      supplierId: input.supplierId || null,
      costPriceCents: input.costPriceCents,
      sellPriceCents: input.sellPriceCents,
      quantity: new Decimal(input.quantity ?? 0),
      minStock: new Decimal(input.minStock ?? 5),
      maxStock: input.maxStock != null ? new Decimal(input.maxStock) : null,
      location: input.location,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      batchNumber: input.batchNumber,
      notes: input.notes,
      imageUrl: input.imageUrl,
      vatInclusive: input.vatInclusive ?? true,
    },
  });

  await writeAuditLog({
    businessId: input.businessId,
    userId: input.userId,
    action: "CREATE",
    entityType: "product",
    entityId: product.id,
    summary: `Created product ${product.name}`,
  });
  await emitDomainEvent({
    type: "product.created",
    businessId: input.businessId,
    productId: product.id,
    userId: input.userId,
  });
  return product;
}

export async function updateProduct(params: {
  businessId: string;
  userId: string;
  id: string;
  data: Record<string, unknown>;
}) {
  const existing = await prisma.product.findFirst({
    where: { id: params.id, businessId: params.businessId, deletedAt: null },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const body = params.data;
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name as string | undefined,
      description: body.description as string | null | undefined,
      sku: body.sku as string | null | undefined,
      barcode: body.barcode as string | null | undefined,
      categoryId: body.categoryId as string | null | undefined,
      brandId: body.brandId as string | null | undefined,
      unitId: body.unitId as string | null | undefined,
      supplierId: body.supplierId as string | null | undefined,
      costPriceCents: body.costPriceCents as number | undefined,
      sellPriceCents: body.sellPriceCents as number | undefined,
      minStock: body.minStock != null ? new Decimal(body.minStock as number) : undefined,
      maxStock:
        body.maxStock === null
          ? null
          : body.maxStock != null
            ? new Decimal(body.maxStock as number)
            : undefined,
      location: body.location as string | null | undefined,
      expiryDate:
        body.expiryDate === null
          ? null
          : body.expiryDate
            ? new Date(body.expiryDate as string)
            : undefined,
      batchNumber: body.batchNumber as string | null | undefined,
      notes: body.notes as string | null | undefined,
      imageUrl: body.imageUrl as string | null | undefined,
      isActive: body.isActive as boolean | undefined,
      isArchived: body.isArchived as boolean | undefined,
    },
  });

  await writeAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: "UPDATE",
    entityType: "product",
    entityId: params.id,
    summary: `Updated product ${product.name}`,
  });
  await emitDomainEvent({
    type: "product.updated",
    businessId: params.businessId,
    productId: params.id,
    userId: params.userId,
  });
  return product;
}

export async function duplicateProduct(params: {
  businessId: string;
  userId: string;
  id: string;
}) {
  const existing = await prisma.product.findFirst({
    where: { id: params.id, businessId: params.businessId, deletedAt: null },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const copy = await prisma.product.create({
    data: {
      businessId: params.businessId,
      name: `${existing.name} (Copy)`,
      description: existing.description,
      sku: generateSku(existing.name),
      barcode: null,
      categoryId: existing.categoryId,
      brandId: existing.brandId,
      unitId: existing.unitId,
      supplierId: existing.supplierId,
      costPriceCents: existing.costPriceCents,
      sellPriceCents: existing.sellPriceCents,
      quantity: new Decimal(0),
      minStock: existing.minStock,
      maxStock: existing.maxStock,
      location: existing.location,
      notes: existing.notes,
      imageUrl: existing.imageUrl,
      vatInclusive: existing.vatInclusive,
    },
  });

  await writeAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: "CREATE",
    entityType: "product",
    entityId: copy.id,
    summary: `Duplicated ${existing.name}`,
  });
  await emitDomainEvent({
    type: "product.created",
    businessId: params.businessId,
    productId: copy.id,
    userId: params.userId,
  });
  return copy;
}

export async function softDeleteProduct(params: {
  businessId: string;
  userId: string;
  id: string;
}) {
  const existing = await prisma.product.findFirst({
    where: { id: params.id, businessId: params.businessId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isArchived: true, isActive: false },
  });
  await writeAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: "DELETE",
    entityType: "product",
    entityId: params.id,
    summary: `Deleted product ${existing.name}`,
  });
  await emitDomainEvent({
    type: "product.deleted",
    businessId: params.businessId,
    productId: params.id,
    userId: params.userId,
  });
}

export async function listCategories(businessId: string) {
  return prisma.category.findMany({
    where: { businessId, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(
  businessId: string,
  data: { name: string; description?: string; color?: string },
) {
  return prisma.category.create({ data: { businessId, ...data } });
}

export async function listBrands(businessId: string) {
  return prisma.brand.findMany({
    where: { businessId, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createBrand(businessId: string, data: { name: string }) {
  return prisma.brand.create({ data: { businessId, ...data } });
}

export async function countActiveProducts(businessId: string) {
  return prisma.product.count({
    where: { businessId, deletedAt: null, isArchived: false },
  });
}
