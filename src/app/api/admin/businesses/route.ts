import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const businesses = await prisma.business.findMany({
      where: {
        deletedAt: null,
        ...(status && status !== "ALL"
          ? { approvalStatus: status as "PENDING" | "APPROVED" | "REJECTED" }
          : {}),
        // Hide the internal HQ business from approval lists
        NOT: { slug: "tammyshop-hq" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        subscription: { select: { plan: true, status: true } },
        users: {
          where: { role: "OWNER", deletedAt: null },
          take: 1,
          select: { fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        phone: b.phone,
        approvalStatus: b.approvalStatus,
        createdAt: b.createdAt,
        rejectionReason: b.rejectionReason,
        owner: b.users[0] || null,
        subscription: b.subscription,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to load businesses" }, { status: 500 });
  }
}
