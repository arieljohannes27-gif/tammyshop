import { NextResponse } from "next/server";
import { authErrorResponse, requirePaidPermission } from "@/lib/auth";
import { listNotifications, markNotificationsRead } from "@/services/notification.service";

export async function GET() {
  try {
    const session = await requirePaidPermission("notifications");
    const notifications = await listNotifications({
      businessId: session.businessId,
      userId: session.userId,
    });
    return NextResponse.json({ notifications });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requirePaidPermission("notifications");
    const body = await req.json();
    await markNotificationsRead({
      businessId: session.businessId,
      id: body.id,
      markAll: Boolean(body.markAll),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
