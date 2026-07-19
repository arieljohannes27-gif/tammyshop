import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/types";
import { businessHasPaidAccess, businessIsApproved } from "@/lib/subscription";

export type CommerceActor = {
  businessId: string;
  auth: "api_key" | "session";
  userId?: string;
  apiKeyId?: string;
  scopes: string[];
  role?: UserRole;
  isPlatformAdmin?: boolean;
};

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKeySecret() {
  const secret = randomBytes(24).toString("base64url");
  const raw = `tsk_live_${secret}`;
  const prefix = raw.slice(0, 16);
  return { raw, prefix, hash: hashKey(raw) };
}

export function hasScope(actor: CommerceActor, scope: string) {
  if (actor.scopes.includes("*")) return true;
  if (actor.scopes.includes(scope)) return true;
  const [resource] = scope.split(":");
  return actor.scopes.includes(`${resource}:*`);
}

async function requireBusinessAccess(businessId: string) {
  const approved = await businessIsApproved(businessId);
  if (!approved) throw new Error("APPROVAL_REQUIRED");
  const paid = await businessHasPaidAccess(businessId);
  if (!paid) throw new Error("PAYMENT_REQUIRED");
}

/** Authenticate Commerce API via X-Api-Key or Admin session cookie. */
export async function requireCommerceAuth(
  req: Request,
  requiredScope: string,
): Promise<CommerceActor> {
  const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (apiKeyHeader?.startsWith("tsk_")) {
    const keyHash = hashKey(apiKeyHeader);
    const key = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!key || key.revokedAt) throw new Error("UNAUTHORIZED");
    await requireBusinessAccess(key.businessId);

    const scopes = Array.isArray(key.scopes) ? (key.scopes as string[]) : [];
    const actor: CommerceActor = {
      businessId: key.businessId,
      auth: "api_key",
      apiKeyId: key.id,
      scopes: scopes.length ? scopes : ["catalog:read", "orders:write", "orders:read"],
    };
    if (!hasScope(actor, requiredScope)) throw new Error("FORBIDDEN");

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });
    return actor;
  }

  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (!session.isPlatformAdmin) {
    await requireBusinessAccess(session.businessId);
  }

  const actor: CommerceActor = {
    businessId: session.businessId,
    auth: "session",
    userId: session.userId,
    role: session.role,
    isPlatformAdmin: session.isPlatformAdmin,
    scopes: ["*"],
  };
  if (!hasScope(actor, requiredScope)) throw new Error("FORBIDDEN");
  return actor;
}

export async function createApiKey(params: {
  businessId: string;
  name: string;
  scopes?: string[];
  userId?: string;
}) {
  const { raw, prefix, hash } = generateApiKeySecret();
  const key = await prisma.apiKey.create({
    data: {
      businessId: params.businessId,
      name: params.name,
      keyPrefix: prefix,
      keyHash: hash,
      scopes: params.scopes ?? ["catalog:read", "orders:read", "orders:write"],
    },
  });
  return { key, raw };
}

export async function listApiKeys(businessId: string) {
  return prisma.apiKey.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
}

export async function revokeApiKey(businessId: string, id: string) {
  const existing = await prisma.apiKey.findFirst({ where: { id, businessId } });
  if (!existing) throw new Error("NOT_FOUND");
  return prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export function commerceErrorResponse(e: unknown) {
  if (e instanceof Error) {
    if (e.message === "UNAUTHORIZED") return { error: "Unauthorized", status: 401 as const };
    if (e.message === "FORBIDDEN") return { error: "Forbidden", status: 403 as const };
    if (e.message === "PAYMENT_REQUIRED") return { error: "Payment required", status: 402 as const };
    if (e.message === "APPROVAL_REQUIRED") return { error: "Approval required", status: 403 as const };
    if (e.message === "NOT_FOUND") return { error: "Not found", status: 404 as const };
    if (e.message === "INSUFFICIENT_STOCK") return { error: "Insufficient stock", status: 409 as const };
    if (e.message === "IDEMPOTENCY_CONFLICT") {
      return { error: "Idempotency key already used with different payload", status: 409 as const };
    }
  }
  return null;
}
