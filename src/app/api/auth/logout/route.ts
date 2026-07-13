import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/audit.service";

export async function POST() {
  const session = await getSession();
  if (session) {
    await prisma.session.update({
      where: { id: session.sessionId },
      data: { revokedAt: new Date() },
    });
    await writeAuditLog({
      businessId: session.businessId,
      userId: session.userId,
      action: "LOGOUT",
      entityType: "user",
      entityId: session.userId,
      summary: `${session.fullName} signed out`,
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
