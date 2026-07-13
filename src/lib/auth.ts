import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { SessionPayload, UserRole } from "@/types";
import { PLAN_FEATURES, type PlanFeatures, type SubscriptionPlan } from "@/types";
import { businessHasPaidAccess } from "@/lib/subscription";

const COOKIE_NAME = "tammyshop_session";
const IDLE_MINUTES = 60 * 8;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload, expiresAt: Date) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const idleLimit = new Date(Date.now() - IDLE_MINUTES * 60 * 1000);
  if (session.lastActiveAt < idleLimit) return null;

  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  });

  return payload;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function requireOwnerOrManager(): Promise<SessionPayload> {
  return requireRole("OWNER", "MANAGER");
}

export function sessionExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function requirePaidSession(): Promise<SessionPayload> {
  const session = await requireSession();
  const paid = await businessHasPaidAccess(session.businessId);
  if (!paid) throw new Error("PAYMENT_REQUIRED");
  return session;
}

export async function getBusinessPlan(businessId: string): Promise<PlanFeatures> {
  const sub = await prisma.subscription.findUnique({ where: { businessId } });
  if (!sub) return PLAN_FEATURES.FREE;

  const plan = sub.plan as SubscriptionPlan;
  const paid =
    (plan === "STARTER" || plan === "ADVANCED") &&
    (sub.status === "ACTIVE" ||
      (sub.status === "TRIALING" && (!sub.trialEndsAt || sub.trialEndsAt > new Date())));

  if (!paid) return PLAN_FEATURES.FREE;
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.FREE;
}

export function hasPermission(role: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    OWNER: ["*"],
    MANAGER: [
      "dashboard",
      "inventory",
      "sales",
      "purchases",
      "suppliers",
      "customers",
      "reports",
      "analytics",
      "shopping-list",
      "settings.view",
      "notifications",
    ],
    EMPLOYEE: ["dashboard", "inventory.view", "sales", "customers.view", "notifications"],
  };
  const allowed = permissions[role] ?? [];
  if (allowed.includes("*")) return true;
  return allowed.some((p) => action === p || action.startsWith(`${p}.`) || p.startsWith(action));
}

export { COOKIE_NAME, IDLE_MINUTES };
