import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/AccountNav";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { requirePageUser } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order History",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await requirePageUser("/account/orders");
  const db = await getDb();
  const list = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AccountNav signedIn />
      <h1 className="mb-5 font-display text-2xl font-bold text-pt-ink">
        Order History
      </h1>

      {list.length === 0 ? (
        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-8 text-center text-xs text-pt-ink-muted">
          No orders yet.{" "}
          <Link href="/shop" className="font-bold text-pt-cobalt underline">
            Explore the catalogue
          </Link>
          .
        </div>
      ) : (
        <ul
          data-testid="account-orders-list"
          className="divide-y divide-pt-border rounded-xl border border-pt-border bg-pt-surface-elevated"
        >
          {list.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4 text-xs"
            >
              <div>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="font-mono text-sm font-bold text-pt-ink hover:text-pt-tangerine"
                >
                  {o.orderNumber}
                </Link>
                <p className="mt-0.5 text-pt-ink-muted">
                  Placed{" "}
                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  | Ship to {o.shippingAddressJson.city} - {o.shippingPinCode}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="cobalt">{o.status}</Badge>
                <Badge tone={o.isDemoOrder ? "amber" : "lime"}>
                  {o.paymentStatus}
                </Badge>
                <span className="font-mono text-sm font-bold text-pt-ink">
                  {formatPaise(o.grandTotalPaise)}
                </span>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="rounded border border-pt-border-strong px-3 py-1.5 font-semibold text-pt-ink hover:bg-pt-silver"
                >
                  View Details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
