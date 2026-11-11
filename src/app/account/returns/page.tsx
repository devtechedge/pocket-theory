import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/AccountNav";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { orderItems, orders, returnRequests } from "@/db/schema";
import { requirePageUser } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Returns & Replacements",
  robots: { index: false, follow: false },
};

export default async function AccountReturnsPage() {
  const user = await requirePageUser("/account/returns");
  const db = await getDb();

  const rows = await db
    .select({
      ret: returnRequests,
      orderNumber: orders.orderNumber,
      productTitle: orderItems.productTitle,
      variantLabel: orderItems.variantLabel,
    })
    .from(returnRequests)
    .innerJoin(orders, eq(returnRequests.orderId, orders.id))
    .innerJoin(orderItems, eq(returnRequests.orderItemId, orderItems.id))
    .where(eq(returnRequests.userId, user.id))
    .orderBy(desc(returnRequests.createdAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountNav signedIn />
      <h1 className="mb-5 font-display text-2xl font-bold text-pt-ink">
        Returns & Replacements
      </h1>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-8 text-xs text-pt-ink-muted">
          No return or replacement requests submitted. To open one, select an
          eligible order under{" "}
          <Link
            href="/account/orders"
            className="font-bold text-pt-cobalt underline"
          >
            Order History
          </Link>
          .
        </div>
      ) : (
        <ul
          data-testid="account-returns-list"
          className="space-y-3"
        >
          {rows.map((r) => (
            <li
              key={r.ret.id}
              className="rounded-xl border border-pt-border bg-pt-surface-elevated p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-pt-cobalt">
                    {r.orderNumber}
                  </span>{" "}
                  -{" "}
                  <strong className="text-pt-ink">
                    {r.productTitle} ({r.variantLabel})
                  </strong>
                </div>
                <Badge tone="amber">{r.ret.status}</Badge>
              </div>
              <p className="mt-1.5 font-semibold text-pt-ink">{r.ret.reason}</p>
              <p className="mt-0.5 text-pt-ink-muted">{r.ret.details}</p>
              <p className="mt-1.5 font-mono text-pt-ink-muted">
                Refund/Replacement Value:{" "}
                {formatPaise(r.ret.refundAmountPaise)}
              </p>
              {r.ret.resolutionNote && (
                <p className="mt-1 font-mono text-pt-cobalt">
                  Ops Note: {r.ret.resolutionNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
