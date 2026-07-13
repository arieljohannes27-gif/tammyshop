import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePaidSession } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";
import { Decimal } from "@prisma/client/runtime/library";
import { generateSku } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidSession();
    const { id } = await ctx.params;
    const product = await prisma.product.findFirst({
      where: { id, businessId: session.businessId, deletedAt: null },
      include: { category: true, brand: true, unit: true, supplier: true, stockMovements: { orderBy: { createdAt: "desc" }, take: 30 } },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      product: {
        ...product,
        quantity: Number(product.quantity),
        minStock: Number(product.minStock),
        maxStock: product.maxStock != null ? Number(product.maxStock) : null,
        stockMovements: product.stockMovements.map((m) => ({
          ...m,
          quantity: Number(m.quantity),
          quantityAfter: Number(m.quantityAfter),
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const patchSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  costPriceCents: z.number().int().optional(),
  sellPriceCents: z.number().int().optional(),
  minStock: z.number().optional(),
  maxStock: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  duplicate: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidSession();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.product.findFirst({ where: { id, businessId: session.businessId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.duplicate) {
      const copy = await prisma.product.create({
        data: {
          businessId: session.businessId,
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
      await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "CREATE", entityType: "product", entityId: copy.id, summary: `Duplicated ${existing.name}` });
      return NextResponse.json({ product: copy });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        barcode: body.barcode,
        categoryId: body.categoryId,
        brandId: body.brandId,
        unitId: body.unitId,
        supplierId: body.supplierId,
        costPriceCents: body.costPriceCents,
        sellPriceCents: body.sellPriceCents,
        minStock: body.minStock != null ? new Decimal(body.minStock) : undefined,
        maxStock: body.maxStock === null ? null : body.maxStock != null ? new Decimal(body.maxStock) : undefined,
        location: body.location,
        expiryDate: body.expiryDate === null ? null : body.expiryDate ? new Date(body.expiryDate) : undefined,
        batchNumber: body.batchNumber,
        notes: body.notes,
        imageUrl: body.imageUrl,
        isActive: body.isActive,
        isArchived: body.isArchived,
      },
    });

    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "UPDATE", entityType: "product", entityId: id, summary: `Updated product ${product.name}` });
    return NextResponse.json({ product });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidSession();
    const { id } = await ctx.params;
    const existing = await prisma.product.findFirst({ where: { id, businessId: session.businessId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isArchived: true, isActive: false } });
    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "DELETE", entityType: "product", entityId: id, summary: `Deleted product ${existing.name}` });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
