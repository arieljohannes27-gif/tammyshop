import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessHasPaidAccess } from "@/lib/subscription";
import { AppShell } from "@/components/layout/AppShell";

const UNPAID_ALLOWED = ["/subscribe", "/settings/billing", "/billing/success"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "";
  const unpaidAllowed = UNPAID_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const paid = await businessHasPaidAccess(session.businessId);

  if (!paid && !unpaidAllowed) {
    redirect("/subscribe");
  }

  const unread = await prisma.notification.count({
    where: {
      businessId: session.businessId,
      isRead: false,
      OR: [{ userId: null }, { userId: session.userId }],
    },
  });

  // Minimal shell on subscribe so payment focus stays clean
  if (!paid && pathname.startsWith("/subscribe")) {
    return <div className="min-h-dvh bg-bg">{children}</div>;
  }

  return (
    <AppShell user={session} unreadNotifications={unread}>
      {children}
    </AppShell>
  );
}
