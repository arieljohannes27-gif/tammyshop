import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit.service";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePlatformAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business || business.deletedAt) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const updated = await prisma.business.update({
      where: { id },
      data:
        body.action === "APPROVE"
          ? {
              approvalStatus: "APPROVED",
              approvedAt: new Date(),
              approvedById: session.userId,
              rejectionReason: null,
            }
          : {
              approvalStatus: "REJECTED",
              approvedAt: null,
              approvedById: session.userId,
              rejectionReason: body.reason || "Rejected by admin",
            },
    });

    await writeAuditLog({
      businessId: id,
      userId: session.userId,
      action: "SETTINGS",
      entityType: "business",
      entityId: id,
      summary:
        body.action === "APPROVE"
          ? `Shop ${business.name} approved by platform admin`
          : `Shop ${business.name} rejected by platform admin`,
    });

    return NextResponse.json({ business: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
