import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { UserRoleRow } from "@/components/admin/AdminSettingsClient";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Users & Roles",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const actor = await requirePageCapability("MANAGE_USERS_AND_SETTINGS");
  const db = await getDb();
  const userRows = await db.select().from(users).orderBy(asc(users.email));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <h1 className="mb-1 font-display text-2xl font-bold text-pt-ink">
        Admin Team & RBAC Role Assignments
      </h1>
      <p className="mb-5 text-xs text-pt-ink-muted">
        Restricted to SUPER_ADMIN. Every role change is recorded in audit_logs.
      </p>

      <div
        tabIndex={0}
        role="region"
        aria-label="Users and roles table"
        className="overflow-x-auto rounded-xl border border-pt-border bg-pt-surface-elevated"
      >
        <table className="w-full min-w-[38rem] text-left">
          <thead>
            <tr className="border-b border-pt-border bg-pt-surface font-mono text-xs uppercase text-pt-ink-muted">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pt-border">
            {userRows.map((u) => (
              <UserRoleRow key={u.id} user={u} isSelf={u.id === actor.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
