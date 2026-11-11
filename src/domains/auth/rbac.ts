import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { auditLogs, type UserRole } from "@/db/schema";
import { getCurrentUser, type AuthenticatedUser } from "./session";

export const ADMIN_CONSOLE_ROLES: readonly UserRole[] = [
  "SUPPORT_OPS",
  "CATALOG_MANAGER",
  "SUPER_ADMIN",
];

export type AdminCapability =
  | "VIEW_ADMIN_OVERVIEW"
  | "MANAGE_CATALOG"
  | "MANAGE_INVENTORY"
  | "MANAGE_ORDERS_RETURNS"
  | "MANAGE_PROMOTIONS"
  | "VIEW_CUSTOMERS"
  | "VIEW_UNREDACTED_CUSTOMER_CONTACT"
  | "MANAGE_USERS_AND_SETTINGS";

const CAPABILITY_MATRIX: Record<AdminCapability, readonly UserRole[]> = {
  VIEW_ADMIN_OVERVIEW: ["SUPPORT_OPS", "CATALOG_MANAGER", "SUPER_ADMIN"],
  MANAGE_CATALOG: ["CATALOG_MANAGER", "SUPER_ADMIN"],
  MANAGE_INVENTORY: ["CATALOG_MANAGER", "SUPER_ADMIN"],
  MANAGE_ORDERS_RETURNS: ["SUPPORT_OPS", "SUPER_ADMIN"],
  MANAGE_PROMOTIONS: ["CATALOG_MANAGER", "SUPER_ADMIN"],
  VIEW_CUSTOMERS: ["SUPPORT_OPS", "CATALOG_MANAGER", "SUPER_ADMIN"],
  VIEW_UNREDACTED_CUSTOMER_CONTACT: ["SUPPORT_OPS", "SUPER_ADMIN"],
  MANAGE_USERS_AND_SETTINGS: ["SUPER_ADMIN"],
};

export function hasCapability(
  role: UserRole | null | undefined,
  capability: AdminCapability,
): boolean {
  if (!role) return false;
  return CAPABILITY_MATRIX[capability].includes(role);
}

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
