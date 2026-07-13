import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrManager } from "@/lib/auth";
import { createPayFastCheckout } from "@/lib/payfast";
import { writeAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    const session = await requireOwnerOrManager();
    const body = z.object({ plan: z.enum(["STARTER", "ADVANCED"]) }).parse(await req.json());
    const business = await prisma.business.findUnique({ where: { id: session.businessId } });
    const user = await prisma.user.findUnique({ where: { id: session.userId } });

    const checkout = await createPayFastCheckout({
      businessId: session.businessId,
      email: business?.email || session.email,
      firstName: user?.fullName?.split(" ")[0] || "TammyShop",
      lastName: user?.fullName?.split(" ").slice(1).join(" ") || "Owner",
      plan: body.plan,
    });

    if (checkout.simulated) {
      await prisma.subscription.update({
        where: { businessId: session.businessId },
        data: {
          plan: body.plan,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      await writeAuditLog({
        businessId: session.businessId,
        userId: session.userId,
        action: "BILLING",
        entityType: "subscription",
        summary: `Activated ${body.plan} (simulated PayFast)`,
      });
      return NextResponse.json({ simulated: true, url: checkout.url });
    }

    return NextResponse.json({
      simulated: false,
      action: checkout.action,
      fields: checkout.fields,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
