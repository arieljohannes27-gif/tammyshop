import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { writeAuditLog } from "@/services/audit.service";

/** Activate subscription after Stripe Checkout returns (backup if webhook is delayed). */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = z.object({ sessionId: z.string().min(1) }).parse(await req.json());
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
    }

    const checkout = await stripe.checkout.sessions.retrieve(body.sessionId);
    if (checkout.payment_status !== "paid" && checkout.status !== "complete") {
      return NextResponse.json({ error: "Payment not complete" }, { status: 400 });
    }

    const businessId = checkout.metadata?.businessId;
    const plan = checkout.metadata?.plan as "STARTER" | "ADVANCED" | undefined;
    if (!businessId || !plan || businessId !== session.businessId) {
      return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
    }

    await prisma.subscription.update({
      where: { businessId },
      data: {
        plan,
        status: "ACTIVE",
        stripeCustomerId: typeof checkout.customer === "string" ? checkout.customer : undefined,
        stripeSubscriptionId:
          typeof checkout.subscription === "string" ? checkout.subscription : undefined,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await writeAuditLog({
      businessId,
      userId: session.userId,
      action: "BILLING",
      entityType: "subscription",
      summary: `Activated ${plan} via checkout confirm`,
    });

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  }
}
