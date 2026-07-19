import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPayFastConfigured,
  validatePayFastItn,
  verifyPayFastItnSignature,
} from "@/lib/payfast";
import { activateSubscription } from "@/services/billing.service";
import "@/services/notification.service";

function formToRecord(form: FormData): Record<string, string> {
  const data: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") data[key] = value;
  });
  return data;
}

/** PayFast Instant Transaction Notification (ITN) */
export async function POST(req: Request) {
  try {
    if (!isPayFastConfigured()) {
      return new NextResponse("OK", { status: 200 });
    }

    const data = formToRecord(await req.formData());
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    if (!verifyPayFastItnSignature(data, passphrase)) {
      console.error("PayFast ITN signature mismatch", {
        keys: Object.keys(data),
        payment_status: data.payment_status,
      });
      return new NextResponse("Invalid signature", { status: 400 });
    }

    if (data.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      return new NextResponse("Invalid merchant", { status: 400 });
    }

    const { signature: _sig, ...rest } = data;
    const ordered = Object.entries(rest)
      .filter(([, v]) => v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`)
      .join("&");
    try {
      await validatePayFastItn(ordered);
    } catch (e) {
      console.warn("PayFast validate call failed (continuing with signature check)", e);
    }

    const status = data.payment_status;
    const businessId = data.custom_str1;
    const plan = data.custom_str2 as "STARTER" | "ADVANCED" | undefined;

    if (status === "COMPLETE" && businessId && (plan === "STARTER" || plan === "ADVANCED")) {
      await activateSubscription({
        businessId,
        plan,
        stripeCustomerId: data.pf_payment_id || data.m_payment_id || undefined,
        stripeSubscriptionId: data.token || undefined,
      });
    }

    if (status === "CANCELLED" && businessId) {
      await prisma.subscription.update({
        where: { businessId },
        data: {
          status: "CANCELLED",
          plan: "FREE",
          cancelledAt: new Date(),
        },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("PayFast ITN error", e);
    return new NextResponse("Error", { status: 500 });
  }
}
