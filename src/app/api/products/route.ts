import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, getBusinessPlan, requirePaidPermission } from "@/lib/auth";
import { countActiveProducts, createProduct, listProducts } from "@/services/catalog.service";

export async function GET(req: Request) {
  try {
    const session = await requirePaidPermission("inventory.view");
    const { searchParams } = new URL(req.url);
    const products = await listProducts({
      businessId: session.businessId,
      q: searchParams.get("q")?.trim() || undefined,
      includeArchived: searchParams.get("archived") === "1",
    });
    return NextResponse.json({ products });
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
      const count = await countActiveProducts(session.businessId);
      if (count >= plan.maxProducts) {
        return NextResponse.json(
          { error: `Product limit reached (${plan.maxProducts}). Upgrade your plan.` },
          { status: 402 },
        );
      }
    }

    const product = await createProduct({
      businessId: session.businessId,
      userId: session.userId,
      ...body,
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
