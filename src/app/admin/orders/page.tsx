import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { orders, returnRequests } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Orders & Returns",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const actor = await requirePageCapability("MANAGE_ORDERS_RETURNS");
  const db = await getDb();

  const [orderRows, returnRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50),
    db.select().from(returnRequests).orderBy(desc(returnRequests.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-pt-ink">
          Orders, Fulfilment & Returns ({orderRows.length})
        </h1>
        <Badge tone="amber">{returnRows.length} Total RMA Records</Badge>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="Admin orders table"
        className="overflow-x-auto rounded-xl border border-pt-border bg-pt-surface-elevated"
      >
        <table className="w-full min-w-[46rem] text-left text-xs">
          <thead>
            <tr className="border-b border-pt-border bg-pt-surface font-mono uppercase text-pt-ink-muted">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer & PIN</th>
              <th className="px-4 py-3">Total (INR)</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfilment</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pt-border">
            {orderRows.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  {o.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-pt-ink">
                    {o.customerName}
                  </div>
                  <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
                    {o.shippingAddressJson.city} - {o.shippingPinCode}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  {formatPaise(o.grandTotalPaise)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={o.isDemoOrder ? "amber" : "lime"}>
                    {o.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="cobalt">{o.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    data-testid={`admin-manage-order-${o.orderNumber}`}
                    className="font-mono font-bold text-pt-tangerine hover:underline"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
