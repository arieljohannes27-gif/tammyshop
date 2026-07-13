import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePaidSession, getBusinessPlan } from "@/lib/auth";
import { generateSku, parseRandToCents } from "@/lib/utils";
import { writeAuditLog } from "@/services/audit.service";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  cost: z.union([z.string(), z.number()]).optional(),
  sell: z.union([z.string(), z.number()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  minStock: z.union([z.string(), z.number()]).optional(),
  location: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requirePaidSession();
    const body = await req.json();
    const rows = z.array(rowSchema).parse(body.rows || []);
    const plan = await getBusinessPlan(session.businessId);
    const existing = await prisma.product.count({ where: { businessId: session.businessId, deletedAt: null, isArchived: false } });
    if (plan.maxProducts != null && existing + rows.length > plan.maxProducts) {
      return NextResponse.json({ error: "Import would exceed product limit" }, { status: 402 });
    }

    let created = 0;
    for (const row of rows) {
      await prisma.product.create({
        data: {
          businessId: session.businessId,
          name: row.name,
          sku: row.sku || generateSku(row.name),
          barcode: row.barcode || null,
          costPriceCents: typeof row.cost === "number" ? Math.round(row.cost * 100) : parseRandToCents(String(row.cost || "0")),
          sellPriceCents: typeof row.sell === "number" ? Math.round(row.sell * 100) : parseRandToCents(String(row.sell || "0")),
          quantity: new Decimal(Number(row.quantity || 0)),
          minStock: new Decimal(Number(row.minStock || 5)),
          location: row.location,
        },
      });
      created += 1;
    }

    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "IMPORT", entityType: "product", summary: `Imported ${created} products` });
    return NextResponse.json({ created });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
