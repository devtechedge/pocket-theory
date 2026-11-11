"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import type { UserRole } from "@/db/schema";
import { hasCapability, type AdminCapability } from "@/domains/auth/rbac";

const NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  capability: AdminCapability;
}> = [
  {
    href: "/admin",
    label: "Overview & Reports",
    capability: "VIEW_ADMIN_OVERVIEW",
  },
  {
    href: "/admin/products",
    label: "Products (40 SKUs)",
    capability: "MANAGE_CATALOG",
  },
  {
    href: "/admin/categories",
    label: "Categories & Merchandising",
    capability: "MANAGE_CATALOG",
  },
  {
    href: "/admin/inventory",
    label: "Inventory Ledger",
    capability: "MANAGE_INVENTORY",
  },
  {
    href: "/admin/orders",
    label: "Orders & Returns",
    capability: "MANAGE_ORDERS_RETURNS",
  },
  {
    href: "/admin/promotions",
    label: "Coupons & Tax Rules",
    capability: "MANAGE_PROMOTIONS",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    capability: "VIEW_CUSTOMERS",
  },
  {
    href: "/admin/users",
    label: "Admin Team & RBAC",
    capability: "MANAGE_USERS_AND_SETTINGS",
  },
  {
    href: "/admin/audit",
    label: "Audit, Outbox & Settings",
    capability: "MANAGE_USERS_AND_SETTINGS",
  },
];

export function AdminNav({
  role,
  email,
}: {
  role: UserRole;
  email: string;
}) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((i) =>
    hasCapability(role, i.capability),
  );

  return (
    <div
      data-testid="admin-nav"
      className="mb-6 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pt-border pb-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-pt-ink">
            POCKET THEORY // OPERATIONS CONSOLE
          </span>
          <Badge tone="cobalt">{role}</Badge>
        </div>
        <span className="font-mono text-xs text-pt-ink-muted">{email}</span>
      </div>

      <nav
        aria-label="Admin console navigation"
        className="mt-3 flex flex-wrap gap-1.5"
      >
        {visibleItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-pt-ink text-pt-surface-elevated"
                  : "text-pt-ink-muted hover:bg-pt-silver hover:text-pt-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
