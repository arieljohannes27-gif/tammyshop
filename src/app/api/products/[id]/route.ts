import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import {
  duplicateProduct,
  getProduct,
  softDeleteProduct,
  updateProduct,
} from "@/services/catalog.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidPermission("inventory.view");
    const { id } = await ctx.params;
    const product = await getProduct(session.businessId, id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
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
    const session = await requirePaidPermission("inventory");
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    if (body.duplicate) {
      const product = await duplicateProduct({
        businessId: session.businessId,
        userId: session.userId,
        id,
      });
      return NextResponse.json({ product });
    }

    const { duplicate: _d, ...data } = body;
    const product = await updateProduct({
      businessId: session.businessId,
      userId: session.userId,
      id,
      data,
    });
    return NextResponse.json({ product });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePaidPermission("inventory");
    const { id } = await ctx.params;
    await softDeleteProduct({
      businessId: session.businessId,
      userId: session.userId,
      id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
