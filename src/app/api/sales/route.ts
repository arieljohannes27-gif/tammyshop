import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createStockMovement } from "@/services/inventory.service";
import { writeAuditLog } from "@/services/audit.service";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const limit = Number(new URL(req.url).searchParams.get("limit") || 50);
    const sales = await prisma.sale.findMany({
      where: { businessId: session.businessId },
      include: { items: true, customer: true, cashier: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ sales });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int(),
  costPriceCents: z.number().int(),
  discountCents: z.number().int().default(0),
});

const createSchema = z.object({
  items: z.array(itemSchema).min(1),
  paymentMethod: z.enum(["CASH", "CARD", "EFT", "SPLIT", "OTHER"]),
  discountPercent: z.number().min(0).max(100).default(0),
  discountCents: z.number().int().min(0).default(0),
  customerId: z.string().optional().nullable(),
  couponCode: z.string().optional(),
  cashReceivedCents: z.number().int().optional(),
  splitDetails: z.any().optional(),
  receiptEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = createSchema.parse(await req.json());

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) }, businessId: session.businessId },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let cost = 0;
    const lineItems = body.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new Error("PRODUCT_NOT_FOUND");
      const line = i.unitPriceCents * i.quantity - i.discountCents;
      const lineCost = i.costPriceCents * i.quantity;
      subtotal += line;
      cost += lineCost;
      return {
        productId: i.productId,
        productName: p.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        costPriceCents: i.costPriceCents,
        discountCents: i.discountCents,
        taxCents: 0,
        totalCents: Math.round(line),
        profitCents: Math.round(line - lineCost),
      };
    });

    const pctDiscount = Math.round(subtotal * (body.discountPercent / 100));
    const total = Math.max(0, Math.round(subtotal - pctDiscount - body.discountCents));
    const profit = total - cost;

    const count = await prisma.sale.count({ where: { businessId: session.businessId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(6, "0")}`;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          businessId: session.businessId,
          customerId: body.customerId || null,
          cashierId: session.userId,
          invoiceNumber,
          paymentMethod: body.paymentMethod,
          subtotalCents: Math.round(subtotal),
          discountCents: body.discountCents + pctDiscount,
          discountPercent: body.discountPercent,
          taxCents: 0,
          totalCents: total,
          costCents: Math.round(cost),
          profitCents: Math.round(profit),
          cashReceivedCents: body.cashReceivedCents,
          changeCents: body.cashReceivedCents != null ? body.cashReceivedCents - total : null,
          splitDetails: body.splitDetails,
          couponCode: body.couponCode,
          receiptEmail: body.receiptEmail,
          notes: body.notes,
          items: { create: lineItems },
          payments: {
            create:
              body.paymentMethod === "SPLIT" && Array.isArray(body.splitDetails)
                ? body.splitDetails.map((p: { method: "CASH" | "CARD" | "EFT"; amountCents: number }) => ({
                    method: p.method,
                    amountCents: p.amountCents,
                  }))
                : [{ method: body.paymentMethod, amountCents: total }],
          },
        },
        include: { items: true, payments: true },
      });

      if (body.customerId) {
        await tx.customer.update({
          where: { id: body.customerId },
          data: {
            totalSpentCents: { increment: total },
            loyaltyPoints: { increment: Math.floor(total / 1000) },
          },
        });
      }

      return created;
    });

    for (const item of body.items) {
      await createStockMovement({
        businessId: session.businessId,
        productId: item.productId,
        type: "SALE",
        quantityDelta: -item.quantity,
        unitCostCents: item.costPriceCents,
        reference: sale.invoiceNumber,
        actorUserId: session.userId,
      });
    }

    await writeAuditLog({
      businessId: session.businessId,
      userId: session.userId,
      action: "SALE",
      entityType: "sale",
      entityId: sale.id,
      summary: `Sale ${sale.invoiceNumber} · R${(total / 100).toFixed(2)}`,
    });

    const settings = await prisma.businessSetting.findUnique({ where: { businessId: session.businessId } });
    if (settings && total >= settings.largeSaleThresholdCents) {
      await prisma.notification.create({
        data: {
          businessId: session.businessId,
          type: "LARGE_SALE",
          title: "Large sale recorded",
          message: `${sale.invoiceNumber} for R${(total / 100).toFixed(2)}`,
          link: `/sales/${sale.id}`,
        },
      });
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Product not found" }, { status: 400 });
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Sale failed" }, { status: 500 });
  }
}
