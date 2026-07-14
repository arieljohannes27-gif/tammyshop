import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessHasPaidAccess, businessIsApproved } from "@/lib/subscription";
import { AppShell } from "@/components/layout/AppShell";

const UNPAID_ALLOWED = ["/subscribe", "/settings/billing", "/billing/success"];
const PENDING_ALLOWED = ["/pending-approval"];
const ADMIN_ALLOWED = ["/admin"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "";

  // Platform admin: full access to /admin; skip shop payment/approval gates
  if (session.isPlatformAdmin) {
    if (pathname.startsWith("/admin")) {
      return <div className="min-h-dvh bg-bg">{children}</div>;
    }
    // Admins landing on shop routes go to admin home
    if (!pathname.startsWith("/api")) {
      redirect("/admin");
    }
  }

  const approved = await businessIsApproved(session.businessId);
  const pendingAllowed = PENDING_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!approved && !pendingAllowed) {
    redirect("/pending-approval");
  }

  const unpaidAllowed = UNPAID_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const paid = await businessHasPaidAccess(session.businessId);

  if (approved && !paid && !unpaidAllowed && !ADMIN_ALLOWED.some((p) => pathname.startsWith(p))) {
    redirect("/subscribe");
  }

  const unread = await prisma.notification.count({
    where: {
      businessId: session.businessId,
      isRead: false,
      OR: [{ userId: null }, { userId: session.userId }],
    },
  });

  if ((!paid && pathname.startsWith("/subscribe")) || pathname.startsWith("/pending-approval")) {
    return <div className="min-h-dvh bg-bg">{children}</div>;
  }

  return (
    <AppShell user={session} unreadNotifications={unread}>
      {children}
    </AppShell>
  );
}
