import type { UserRole } from "@/db/schema";

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

export const CAPABILITY_MATRIX: Record<AdminCapability, readonly UserRole[]> = {
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
