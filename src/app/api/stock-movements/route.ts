import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { createStockMovement } from "@/services/inventory.service";

export async function GET(req: Request) {
  try {
    const session = await requirePaidPermission("stock.view");
    const limit = Number(new URL(req.url).searchParams.get("limit") || 100);
    const movements = await prisma.stockMovement.findMany({
      where: { businessId: session.businessId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
    });
    return NextResponse.json({
      movements: movements.map((m) => ({
        ...m,
        quantity: Number(m.quantity),
        quantityAfter: Number(m.quantityAfter),
      })),
    });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const schema = z.object({
  productId: z.string(),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "RETURN", "DAMAGED", "TRANSFER", "ADJUSTMENT"]),
  quantity: z.number(),
  notes: z.string().optional(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requirePaidPermission("stock");
    const body = schema.parse(await req.json());
    const signed =
      body.type === "STOCK_OUT" || body.type === "DAMAGED"
        ? -Math.abs(body.quantity)
        : body.type === "ADJUSTMENT"
          ? body.quantity
          : Math.abs(body.quantity);

    const result = await createStockMovement({
      businessId: session.businessId,
      productId: body.productId,
      type: body.type,
      quantityDelta: signed,
      notes: body.notes,
      fromLocation: body.fromLocation,
      toLocation: body.toLocation,
      actorUserId: session.userId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
