import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { createBrand, listBrands } from "@/services/catalog.service";

export async function GET() {
  try {
    const session = await requirePaidPermission("inventory.view");
    const brands = await listBrands(session.businessId);
    return NextResponse.json({ brands });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePaidPermission("inventory");
    const body = z.object({ name: z.string().min(1) }).parse(await req.json());
    const brand = await createBrand(session.businessId, body);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
