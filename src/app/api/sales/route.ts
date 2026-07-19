import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { createSale } from "@/services/sales.service";

export async function GET(req: Request) {
  try {
    const session = await requirePaidPermission("sales");
    const limit = Number(new URL(req.url).searchParams.get("limit") || 50);
    const sales = await prisma.sale.findMany({
      where: { businessId: session.businessId },
      include: { items: true, customer: true, cashier: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
    });
    return NextResponse.json({ sales });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().optional(),
  costPriceCents: z.number().int().optional(),
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
    const session = await requirePaidPermission("sales");
    const body = createSchema.parse(await req.json());

    const sale = await createSale({
      businessId: session.businessId,
      userId: session.userId,
      items: body.items,
      paymentMethod: body.paymentMethod,
      discountPercent: body.discountPercent,
      discountCents: body.discountCents,
      customerId: body.customerId,
      couponCode: body.couponCode,
      cashReceivedCents: body.cashReceivedCents,
      splitDetails: body.splitDetails,
      receiptEmail: body.receiptEmail,
      notes: body.notes,
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "COUPON_INVALID") {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "COUPON_EXPIRED") {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "COUPON_EXHAUSTED") {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "COUPON_MIN_PURCHASE") {
      return NextResponse.json({ error: "Coupon minimum purchase not met" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Sale failed" }, { status: 500 });
  }
}
