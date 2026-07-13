import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePaidSession } from "@/lib/auth";
import type { GlobalSearchResult } from "@/types";

export async function GET(req: Request) {
  try {
    const session = await requirePaidSession();
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q) return NextResponse.json([]);

    const [products, customers, sales, suppliers, purchases] = await Promise.all([
      prisma.product.findMany({
        where: { businessId: session.businessId, deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { barcode: { contains: q } }] },
        take: 5,
      }),
      prisma.customer.findMany({
        where: { businessId: session.businessId, deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] },
        take: 5,
      }),
      prisma.sale.findMany({
        where: { businessId: session.businessId, OR: [{ invoiceNumber: { contains: q, mode: "insensitive" } }] },
        take: 5,
      }),
      prisma.supplier.findMany({
        where: { businessId: session.businessId, deletedAt: null, name: { contains: q, mode: "insensitive" } },
        take: 5,
      }),
      prisma.purchaseOrder.findMany({
        where: { businessId: session.businessId, orderNumber: { contains: q, mode: "insensitive" } },
        take: 5,
      }),
    ]);

    const results: GlobalSearchResult[] = [
      ...products.map((p) => ({ type: "product" as const, id: p.id, title: p.name, subtitle: p.sku || undefined, href: `/inventory/products/${p.id}` })),
      ...customers.map((c) => ({ type: "customer" as const, id: c.id, title: c.name, subtitle: c.phone || undefined, href: `/customers/${c.id}` })),
      ...sales.map((s) => ({ type: "sale" as const, id: s.id, title: s.invoiceNumber, subtitle: `R${(s.totalCents / 100).toFixed(2)}`, href: `/sales/${s.id}` })),
      ...suppliers.map((s) => ({ type: "supplier" as const, id: s.id, title: s.name, href: `/suppliers/${s.id}` })),
      ...purchases.map((p) => ({ type: "purchase" as const, id: p.id, title: p.orderNumber, href: `/purchases/${p.id}` })),
      ...sales.map((s) => ({ type: "invoice" as const, id: s.id, title: s.invoiceNumber, subtitle: "Invoice", href: `/sales/${s.id}` })),
    ];

    return NextResponse.json(results.slice(0, 20));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
