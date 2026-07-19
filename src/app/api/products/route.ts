import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorResponse, getBusinessPlan, requirePaidPermission } from "@/lib/auth";
import { generateSku } from "@/lib/utils";
import { writeAuditLog } from "@/services/audit.service";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: Request) {
  try {
    const session = await requirePaidPermission("inventory.view");
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const includeArchived = searchParams.get("archived") === "1";

    const products = await prisma.product.findMany({
      where: {
        businessId: session.businessId,
        deletedAt: null,
        ...(includeArchived ? {} : { isArchived: false }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true, brand: true, unit: true, supplier: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        quantity: Number(p.quantity),
        minStock: Number(p.minStock),
        maxStock: p.maxStock != null ? Number(p.maxStock) : null,
      })),
    });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  costPriceCents: z.number().int().min(0),
  sellPriceCents: z.number().int().min(0),
  quantity: z.number().min(0).default(0),
  minStock: z.number().min(0).default(5),
  maxStock: z.number().optional().nullable(),
  location: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  vatInclusive: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requirePaidPermission("inventory");
    const body = createSchema.parse(await req.json());
    const plan = await getBusinessPlan(session.businessId);

    if (plan.maxProducts != null) {
      const count = await prisma.product.count({
        where: { businessId: session.businessId, deletedAt: null, isArchived: false },
      });
      if (count >= plan.maxProducts) {
        return NextResponse.json(
          { error: `Product limit reached (${plan.maxProducts}). Upgrade your plan.` },
          { status: 402 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        businessId: session.businessId,
        name: body.name,
        description: body.description,
        sku: body.sku || generateSku(body.name),
        barcode: body.barcode || null,
        categoryId: body.categoryId || null,
        brandId: body.brandId || null,
        unitId: body.unitId || null,
        supplierId: body.supplierId || null,
        costPriceCents: body.costPriceCents,
        sellPriceCents: body.sellPriceCents,
        quantity: new Decimal(body.quantity),
        minStock: new Decimal(body.minStock),
        maxStock: body.maxStock != null ? new Decimal(body.maxStock) : null,
        location: body.location,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        batchNumber: body.batchNumber,
        notes: body.notes,
        imageUrl: body.imageUrl,
        vatInclusive: body.vatInclusive ?? true,
      },
    });

    await writeAuditLog({
      businessId: session.businessId,
      userId: session.userId,
      action: "CREATE",
      entityType: "product",
      entityId: product.id,
      summary: `Created product ${product.name}`,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
