import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireOwnerOrManager } from "@/lib/auth";
import { startSubscriptionCheckout } from "@/services/billing.service";

export async function POST(req: Request) {
  try {
    const session = await requireOwnerOrManager();
    const body = z.object({ plan: z.enum(["STARTER", "ADVANCED"]) }).parse(await req.json());
    const business = await prisma.business.findUnique({ where: { id: session.businessId } });
    const user = await prisma.user.findUnique({ where: { id: session.userId } });

    const checkout = await startSubscriptionCheckout({
      businessId: session.businessId,
      userId: session.userId,
      email: business?.email || session.email,
      firstName: user?.fullName?.split(" ")[0] || "TammyShop",
      lastName: user?.fullName?.split(" ").slice(1).join(" ") || "Owner",
      plan: body.plan,
    });

    return NextResponse.json(checkout);
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
