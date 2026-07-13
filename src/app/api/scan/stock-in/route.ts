import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createStockMovement } from "@/services/inventory.service";
import { generateSku } from "@/lib/utils";
import { writeAuditLog } from "@/services/audit.service";
import { Decimal } from "@prisma/client/runtime/library";

function normalizeBarcode(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits || trimmed;
}

function barcodeVariants(raw: string): string[] {
  const cleaned = normalizeBarcode(raw);
  const set = new Set<string>([cleaned, raw.trim()]);
  if (cleaned.length === 12) set.add(`0${cleaned}`);
  if (cleaned.length === 13 && cleaned.startsWith("0")) set.add(cleaned.slice(1));
  return [...set].filter(Boolean);
}

async function findByBarcode(businessId: string, barcode: string) {
  const variants = barcodeVariants(barcode);
  return prisma.product.findFirst({
    where: {
      businessId,
      deletedAt: null,
      isArchived: false,
      OR: variants.map((b) => ({ barcode: b })),
    },
    include: { category: true, brand: true },
  });
}

const stockInSchema = z.object({
  barcode: z.string().min(1),
  quantity: z.number().positive().default(1),
  notes: z.string().optional(),
  createIfMissing: z.boolean().optional(),
  name: z.string().optional(),
  costPriceCents: z.number().int().min(0).optional(),
  sellPriceCents: z.number().int().min(0).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const raw = new URL(req.url).searchParams.get("barcode")?.trim();
    if (!raw) return NextResponse.json({ error: "Barcode required" }, { status: 400 });
    const barcode = normalizeBarcode(raw);

    const product = await findByBarcode(session.businessId, barcode);

    if (!product) {
      return NextResponse.json({ found: false, barcode });
    }

    return NextResponse.json({
      found: true,
      barcode,
      product: {
        ...product,
        quantity: Number(product.quantity),
        minStock: Number(product.minStock),
        maxStock: product.maxStock != null ? Number(product.maxStock) : null,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = stockInSchema.parse(await req.json());
    const barcode = normalizeBarcode(body.barcode);

    let product = await findByBarcode(session.businessId, barcode);

    if (!product && body.createIfMissing) {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: "Product name required for new stock" }, { status: 400 });
      }
      product = await prisma.product.create({
        data: {
          businessId: session.businessId,
          name: body.name.trim(),
          barcode,
          sku: generateSku(body.name),
          costPriceCents: body.costPriceCents ?? 0,
          sellPriceCents: body.sellPriceCents ?? 0,
          quantity: new Decimal(0),
          minStock: new Decimal(5),
        },
        include: { category: true, brand: true },
      });
      await writeAuditLog({
        businessId: session.businessId,
        userId: session.userId,
        action: "CREATE",
        entityType: "product",
        entityId: product.id,
        summary: `Created product via barcode scan: ${product.name}`,
      });
    }

    if (!product) {
      return NextResponse.json({ found: false, barcode, error: "Product not found" }, { status: 404 });
    }

    const result = await createStockMovement({
      businessId: session.businessId,
      productId: product.id,
      type: "STOCK_IN",
      quantityDelta: body.quantity,
      unitCostCents: product.costPriceCents,
      notes: body.notes || `Barcode scan stock-in (${barcode})`,
      actorUserId: session.userId,
    });

    return NextResponse.json({
      ok: true,
      product: {
        id: result.product.id,
        name: result.product.name,
        barcode: result.product.barcode,
        quantity: Number(result.product.quantity),
      },
      movement: {
        id: result.movement.id,
        quantity: Number(result.movement.quantity),
        quantityAfter: Number(result.movement.quantityAfter),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Stock-in failed" }, { status: 500 });
  }
}
