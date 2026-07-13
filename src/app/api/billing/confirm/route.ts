import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { businessHasPaidAccess } from "@/lib/subscription";
import { writeAuditLog } from "@/services/audit.service";

/**
 * After PayFast return_url: if ITN already activated, report ok.
 * Does not unlock unpaid accounts without a completed ITN (except simulated path elsewhere).
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = z
      .object({ plan: z.enum(["STARTER", "ADVANCED"]).nullable().optional() })
      .parse(await req.json().catch(() => ({})));

    const paid = await businessHasPaidAccess(session.businessId);
    if (paid) {
      const sub = await prisma.subscription.findUnique({ where: { businessId: session.businessId } });
      return NextResponse.json({ ok: true, plan: sub?.plan });
    }

    // Soft note only — real activation comes from PayFast ITN webhook
    if (body.plan) {
      await writeAuditLog({
        businessId: session.businessId,
        userId: session.userId,
        action: "BILLING",
        entityType: "subscription",
        summary: `Returned from PayFast checkout for ${body.plan} (awaiting ITN)`,
      });
    }

    return NextResponse.json({ ok: false, pending: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  }
}
