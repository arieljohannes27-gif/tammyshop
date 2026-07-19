import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireOwnerOrManager } from "@/lib/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/commerce-auth";
import { writeAuditLog } from "@/services/audit.service";

/** Manage Commerce API keys for Lekka Stop Shop / integrations */
export async function GET() {
  try {
    const session = await requireOwnerOrManager();
    const keys = await listApiKeys(session.businessId);
    return NextResponse.json({ keys });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireOwnerOrManager();
    const body = z
      .object({
        name: z.string().min(2).max(80),
        scopes: z.array(z.string()).optional(),
      })
      .parse(await req.json());

    const { key, raw } = await createApiKey({
      businessId: session.businessId,
      name: body.name,
      scopes: body.scopes,
      userId: session.userId,
    });

    await writeAuditLog({
      businessId: session.businessId,
      userId: session.userId,
      action: "SETTINGS",
      entityType: "api_key",
      entityId: key.id,
      summary: `Created API key ${body.name}`,
    });

    return NextResponse.json(
      {
        key: {
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          scopes: key.scopes,
          createdAt: key.createdAt,
        },
        /** Shown once — store securely */
        secret: raw,
      },
      { status: 201 },
    );
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireOwnerOrManager();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await revokeApiKey(session.businessId, id);
    await writeAuditLog({
      businessId: session.businessId,
      userId: session.userId,
      action: "SETTINGS",
      entityType: "api_key",
      entityId: id,
      summary: "Revoked API key",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mapped = authErrorResponse(e);
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
