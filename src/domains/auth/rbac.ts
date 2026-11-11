import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { auditLogs } from "@/db/schema";
import {
  ADMIN_CONSOLE_ROLES,
  hasCapability,
  type AdminCapability,
} from "./capabilities";
import { getCurrentUser, type AuthenticatedUser } from "./session";

export { ADMIN_CONSOLE_ROLES, hasCapability, type AdminCapability };

export class AuthorizationError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: 401 | 403 = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}

export async function requirePageUser(
  nextPath = "/account",
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requirePageCapability(
  capability: AdminCapability,
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=%2Fadmin");
  }
  if (!hasCapability(user.role, capability)) {
    redirect("/account?denied=admin");
  }
  return user;
}

export async function requireApiUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError("Authentication required.", 401);
  }
  return user;
}

export async function requireApiCapability(
  capability: AdminCapability,
): Promise<AuthenticatedUser> {
  const user = await requireApiUser();
  if (!hasCapability(user.role, capability)) {
    throw new AuthorizationError(
      `Role ${user.role} lacks required permission (${capability}).`,
      403,
    );
  }
  return user;
}

export async function writeAuditLog(params: {
  actor: Pick<AuthenticatedUser, "id" | "email" | "role">;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  ipHash?: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.insert(auditLogs).values({
    id: `aud-${randomBytes(10).toString("hex")}`,
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    summary: params.summary,
    beforeJson: params.beforeJson ?? null,
    afterJson: params.afterJson ?? null,
    ipHash: params.ipHash ?? null,
  });
}
