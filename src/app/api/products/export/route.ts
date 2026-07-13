import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePaidSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await requirePaidSession();
  const format = new URL(req.url).searchParams.get("format") || "csv";
  const products = await prisma.product.findMany({
    where: { businessId: session.businessId, deletedAt: null },
    include: { category: true, brand: true },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => ({
    name: p.name,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    category: p.category?.name ?? "",
    brand: p.brand?.name ?? "",
    cost: (p.costPriceCents / 100).toFixed(2),
    sell: (p.sellPriceCents / 100).toFixed(2),
    quantity: Number(p.quantity),
    minStock: Number(p.minStock),
    location: p.location ?? "",
  }));

  if (format === "json") return NextResponse.json({ products: rows });

  const header = Object.keys(rows[0] || { name: "", sku: "", barcode: "", category: "", brand: "", cost: "", sell: "", quantity: "", minStock: "", location: "" });
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => `"${String((r as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tammyshop-products.csv"`,
    },
  });
}
