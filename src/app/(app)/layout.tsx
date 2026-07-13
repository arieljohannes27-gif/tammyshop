import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const unread = await prisma.notification.count({
    where: {
      businessId: session.businessId,
      isRead: false,
      OR: [{ userId: null }, { userId: session.userId }],
    },
  });

  return (
    <AppShell user={session} unreadNotifications={unread}>
      {children}
    </AppShell>
  );
}
