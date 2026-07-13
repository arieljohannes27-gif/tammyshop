import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrManager, requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";

export async function GET() {
  try {
    const session = await requireSession();
    const [business, settings, subscription, users] = await Promise.all([
      prisma.business.findUnique({ where: { id: session.businessId } }),
      prisma.businessSetting.findUnique({ where: { businessId: session.businessId } }),
      prisma.subscription.findUnique({ where: { businessId: session.businessId } }),
      prisma.user.findMany({ where: { businessId: session.businessId, deletedAt: null }, select: { id: true, fullName: true, email: true, role: true, isActive: true, lastLoginAt: true } }),
    ]);
    return NextResponse.json({ business, settings, subscription, users });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const schema = z.object({
  business: z.object({
    name: z.string().optional(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    vatNumber: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    language: z.string().optional(),
    currencyCode: z.string().optional(),
    vatEnabled: z.boolean().optional(),
    vatRate: z.number().optional(),
  }).optional(),
  settings: z.object({
    darkModeDefault: z.boolean().optional(),
    lowStockAlerts: z.boolean().optional(),
    outOfStockAlerts: z.boolean().optional(),
    dailySummaryEmail: z.boolean().optional(),
    largeSaleThresholdCents: z.number().int().optional(),
    receiptFooter: z.string().optional().nullable(),
    allowNegativeStock: z.boolean().optional(),
    backupEnabled: z.boolean().optional(),
  }).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireOwnerOrManager();
    const body = schema.parse(await req.json());
    if (body.business) {
      await prisma.business.update({ where: { id: session.businessId }, data: body.business });
    }
    if (body.settings) {
      await prisma.businessSetting.upsert({
        where: { businessId: session.businessId },
        create: { businessId: session.businessId, ...body.settings },
        update: body.settings,
      });
    }
    await writeAuditLog({ businessId: session.businessId, userId: session.userId, action: "SETTINGS", entityType: "business", entityId: session.businessId, summary: "Updated business settings" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
