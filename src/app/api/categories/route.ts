import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { createCategory, listCategories } from "@/services/catalog.service";

export async function GET() {
  try {
    const session = await requirePaidPermission("inventory.view");
    const categories = await listCategories(session.businessId);
    return NextResponse.json({ categories });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePaidPermission("inventory");
    const body = z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      })
      .parse(await req.json());
    const category = await createCategory(session.businessId, body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
