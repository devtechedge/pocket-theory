import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { orders, users } from "@/db/schema";
import { hasCapability, requirePageCapability } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";
import { redactEmail, redactIndianPhone } from "@/lib/security/redact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Customer Lookup",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  const actor = await requirePageCapability("VIEW_CUSTOMERS");
  const canSeeFullContact = hasCapability(
    actor.role,
    "VIEW_UNREDACTED_CUSTOMER_CONTACT",
  );

  const db = await getDb();
  const [customerRows, orderRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.role, "CUSTOMER"))
      .orderBy(desc(users.createdAt)),
    db.select().from(orders),
  ]);

  const orderSummaryByUser = new Map<
    string,
    { count: number; spendPaise: number }
  >();
  for (const o of orderRows) {
    if (!o.userId || o.status === "CANCELLED") continue;
    const prev = orderSummaryByUser.get(o.userId) ?? {
      count: 0,
      spendPaise: 0,
    };
    prev.count += 1;
    prev.spendPaise += o.grandTotalPaise;
    orderSummaryByUser.set(o.userId, prev);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-pt-ink">
            Customer Lookup ({customerRows.length})
          </h1>
          <p className="text-xs text-pt-ink-muted">
            Least-privilege access: PII is automatically masked for
            CATALOG_MANAGER roles and shown only to SUPPORT_OPS / SUPER_ADMIN.
          </p>
        </div>
        <Badge tone={canSeeFullContact ? "cobalt" : "amber"}>
          {canSeeFullContact ? "Support Contact Visible" : "PII Redacted Mode"}
        </Badge>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="Customers table"
        className="overflow-x-auto rounded-xl border border-pt-border bg-pt-surface-elevated"
      >
        <table className="w-full min-w-[40rem] text-left text-xs">
          <thead>
            <tr className="border-b border-pt-border bg-pt-surface font-mono uppercase text-pt-ink-muted">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pt-border">
            {customerRows.map((c) => {
              const summary = orderSummaryByUser.get(c.id) ?? {
                count: 0,
                spendPaise: 0,
              };
              return (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold text-pt-ink">
                    {c.fullName}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {canSeeFullContact ? c.email : redactEmail(c.email)}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {canSeeFullContact
                      ? c.phone
                        ? `+91 ${c.phone}`
                        : "Not set"
                      : redactIndianPhone(c.phone)}
                  </td>
                  <td className="px-4 py-3 font-mono">{summary.count}</td>
                  <td className="px-4 py-3 font-mono font-bold">
                    {formatPaise(summary.spendPaise)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
