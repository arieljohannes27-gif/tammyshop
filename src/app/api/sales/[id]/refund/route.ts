import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrManager } from "@/lib/auth";
import { businessHasPaidAccess } from "@/lib/subscription";
import { createStockMovement } from "@/services/inventory.service";
import { writeAuditLog } from "@/services/audit.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await requireOwnerOrManager();
    if (!(await businessHasPaidAccess(session.businessId))) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const { id } = await ctx.params;
    const body = z.object({ full: z.boolean().default(true) }).parse(await req.json().catch(() => ({})));
    const sale = await prisma.sale.findFirst({ where: { id, businessId: session.businessId }, include: { items: true } });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (sale.status === "REFUNDED") return NextResponse.json({ error: "Already refunded" }, { status: 400 });

    for (const item of sale.items) {
      await createStockMovement({
        businessId: session.businessId,
        productId: item.productId,
        type: "RETURN",
        quantityDelta: Number(item.quantity),
        unitCostCents: item.costPriceCents,
        reference: `REFUND-${sale.invoiceNumber}`,
        actorUserId: session.userId,
      });
    }

    const updated = await prisma.sale.update({
      where: { id },
      data: {
        status: "REFUNDED",
        refundedCents: sale.totalCents,
      },
    });

    await writeAuditLog({
      businessId: session.businessId,
      userId: session.userId,
      action: "REFUND",
      entityType: "sale",
      entityId: id,
      summary: `Refunded ${sale.invoiceNumber}`,
      metadata: { full: body.full },
    });

    return NextResponse.json({ sale: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
