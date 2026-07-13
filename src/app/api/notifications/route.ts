import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession();
  const notifications = await prisma.notification.findMany({
    where: {
      businessId: session.businessId,
      OR: [{ userId: null }, { userId: session.userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const session = await requireSession();
  const body = await req.json();
  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { businessId: session.businessId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, businessId: session.businessId },
      data: { isRead: true },
    });
  }
  return NextResponse.json({ ok: true });
}
