import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { createCustomer, listCustomers } from "@/services/customer.service";

export async function GET(req: Request) {
  try {
    const session = await requirePaidPermission("customers.view");
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const customers = await listCustomers({ businessId: session.businessId, q });
    return NextResponse.json({ customers });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requirePaidPermission("customers");
    const body = schema.parse(await req.json());
    const customer = await createCustomer({
      businessId: session.businessId,
      userId: session.userId,
      name: body.name,
      email: body.email || null,
      phone: body.phone,
      address: body.address,
      notes: body.notes,
    });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
