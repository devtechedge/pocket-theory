import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/AccountNav";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { addresses, orders, returnRequests } from "@/db/schema";
import { requirePageUser } from "@/domains/auth/rbac";
import { listWishlistProductIds } from "@/domains/wishlist/service";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const user = await requirePageUser("/account");
  const db = await getDb();

  const [userOrders, userAddresses, userReturns, wishlistIds] =
    await Promise.all([
      db
        .select()
        .from(orders)
        .where(eq(orders.userId, user.id))
        .orderBy(desc(orders.createdAt))
        .limit(5),
      db.select().from(addresses).where(eq(addresses.userId, user.id)),
      db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.userId, user.id)),
      listWishlistProductIds(),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AccountNav signedIn />

      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Badge tone="cobalt">{user.role}</Badge>
            <h1 className="mt-2 font-display text-2xl font-bold text-pt-ink">
              {user.fullName}
            </h1>
            <p className="font-mono text-xs text-pt-ink-muted">
              {user.email} {user.phone ? `| +91 ${user.phone}` : ""}
            </p>
          </div>
          {user.role !== "CUSTOMER" && (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center rounded-md bg-pt-cobalt px-4 text-xs font-semibold text-white"
            >
              Open Admin Console →
            </Link>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-pt-border pt-5 sm:grid-cols-4">
          <Link
            href="/account/orders"
            className="rounded-lg border border-pt-border bg-pt-surface p-3.5 hover:border-pt-tangerine"
          >
            <dt className="font-mono text-[0.6875rem] text-pt-ink-muted uppercase">
              Recent Orders
            </dt>
            <dd className="mt-1 font-mono text-xl font-bold text-pt-ink">
              {userOrders.length}
            </dd>
          </Link>
          <Link
            href="/account/addresses"
            className="rounded-lg border border-pt-border bg-pt-surface p-3.5 hover:border-pt-tangerine"
          >
            <dt className="font-mono text-[0.6875rem] text-pt-ink-muted uppercase">
              Saved Addresses
            </dt>
            <dd className="mt-1 font-mono text-xl font-bold text-pt-ink">
              {userAddresses.length}
            </dd>
          </Link>
          <Link
            href="/account/wishlist"
            className="rounded-lg border border-pt-border bg-pt-surface p-3.5 hover:border-pt-tangerine"
          >
            <dt className="font-mono text-[0.6875rem] text-pt-ink-muted uppercase">
              Wishlist Items
            </dt>
            <dd className="mt-1 font-mono text-xl font-bold text-pt-ink">
              {wishlistIds.length}
            </dd>
          </Link>
          <Link
            href="/account/returns"
            className="rounded-lg border border-pt-border bg-pt-surface p-3.5 hover:border-pt-tangerine"
          >
            <dt className="font-mono text-[0.6875rem] text-pt-ink-muted uppercase">
              Return Requests
            </dt>
            <dd className="mt-1 font-mono text-xl font-bold text-pt-ink">
              {userReturns.length}
            </dd>
          </Link>
        </dl>
      </div>

      <section aria-labelledby="recent-orders-heading" className="mt-8">
        <div className="flex items-center justify-between">
          <h2
            id="recent-orders-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            Recent Orders
          </h2>
          <Link
            href="/account/orders"
            className="font-mono text-xs font-bold text-pt-cobalt hover:underline"
          >
            All Orders →
          </Link>
        </div>

        {userOrders.length === 0 ? (
          <p className="mt-3 rounded-lg border border-pt-border bg-pt-surface-elevated p-6 text-xs text-pt-ink-muted">
            No orders placed under this account yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-pt-border rounded-xl border border-pt-border bg-pt-surface-elevated">
            {userOrders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
              >
                <div>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="font-mono text-sm font-bold text-pt-ink hover:text-pt-tangerine"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="mt-0.5 text-pt-ink-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    | {o.shippingPinCode}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="cobalt">{o.status}</Badge>
                  <span className="font-mono text-sm font-bold text-pt-ink">
                    {formatPaise(o.grandTotalPaise)}
                  </span>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="font-mono font-bold text-pt-cobalt hover:underline"
                  >
                    Inspect →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
