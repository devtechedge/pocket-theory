import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/Badge";
import { getAdminAnalyticsOverview } from "@/domains/admin/analytics";
import { hasCapability, requirePageCapability } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Operations Overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const actor = await requirePageCapability("VIEW_ADMIN_OVERVIEW");
  const stats = await getAdminAnalyticsOverview();

  return (
    <div
      data-testid="admin-command-center"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
    >
      <AdminNav role={actor.role} email={actor.email} />

      {/* KPI Row computed from real PostgreSQL records */}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-4">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Recorded Order Value (Incl. Demo)
          </dt>
          <dd className="mt-1.5 font-mono text-2xl font-extrabold text-pt-ink">
            {formatPaise(stats.totalRevenuePaise)}
          </dd>
          <p className="mt-1 text-[0.6875rem] text-pt-ink-muted">
            Across {stats.orderCount} non-cancelled DB orders
          </p>
        </div>

        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-4">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Average Order Value (AOV)
          </dt>
          <dd className="mt-1.5 font-mono text-2xl font-extrabold text-pt-ink">
            {formatPaise(stats.averageOrderValuePaise)}
          </dd>
          <p className="mt-1 text-[0.6875rem] text-pt-ink-muted">
            Integer-paise server calculation
          </p>
        </div>

        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-4">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Active / Held Catalogue SKUs
          </dt>
          <dd className="mt-1.5 font-mono text-2xl font-extrabold text-pt-ink">
            {stats.activeProductCount}{" "}
            <span className="text-sm font-normal text-pt-ink-muted">
              active / {stats.unpublishedCount} held
            </span>
          </dd>
          <p className="mt-1 text-[0.6875rem] text-pt-ink-muted">
            Compliance publication gate enforced
          </p>
        </div>

        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-4">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Pending Returns & Outbox
          </dt>
          <dd className="mt-1.5 font-mono text-2xl font-extrabold text-pt-ink">
            {stats.pendingReturnCount}{" "}
            <span className="text-sm font-normal text-pt-ink-muted">
              returns / {stats.outboxCount} emails
            </span>
          </dd>
          <p className="mt-1 text-[0.6875rem] text-pt-ink-muted">
            Live database operational queue
          </p>
        </div>
      </dl>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category & Product Performance */}
        <section className="min-w-0 rounded-xl border border-pt-border bg-pt-surface-elevated p-5 lg:col-span-7">
          <h2 className="font-display text-base font-bold text-pt-ink">
            Category & Top SKU Performance (Database Records)
          </h2>

          <div
            tabIndex={0}
            role="region"
            aria-label="Category sales table"
            className="mt-3 overflow-x-auto"
          >
            <table className="w-full min-w-[26rem] text-left text-xs">
              <thead>
                <tr className="border-b border-pt-border font-mono uppercase text-pt-ink-muted">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Units</th>
                  <th className="py-2 text-right">Gross Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pt-border">
                {stats.categoryPerformance.map((c) => (
                  <tr key={c.categoryName}>
                    <td className="py-2 pr-4 font-semibold text-pt-ink">
                      {c.categoryName}
                    </td>
                    <td className="py-2 pr-4 font-mono">{c.units}</td>
                    <td className="py-2 text-right font-mono font-bold text-pt-ink">
                      {formatPaise(c.revenuePaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 font-mono text-xs font-bold text-pt-ink-muted uppercase">
            Top Ordered SKUs
          </h3>
          <ul className="mt-2 divide-y divide-pt-border text-xs">
            {stats.topProducts.map((p) => (
              <li
                key={p.sku}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div>
                  <span className="font-semibold text-pt-ink">{p.title}</span>{" "}
                  <span className="font-mono text-pt-ink-muted">({p.sku})</span>
                </div>
                <span className="font-mono font-bold text-pt-ink">
                  {p.units} u // {formatPaise(p.revenuePaise)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Low Stock Watchlist */}
        <section className="min-w-0 rounded-xl border border-pt-border bg-pt-surface-elevated p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-pt-ink">
              Inventory Watch (≤12 Units)
            </h2>
            {hasCapability(actor.role, "MANAGE_INVENTORY") && (
              <Link
                href="/admin/inventory"
                className="font-mono text-xs font-bold text-pt-cobalt hover:underline"
              >
                Adjust Stock →
              </Link>
            )}
          </div>

          <ul className="mt-3 divide-y divide-pt-border text-xs">
            {stats.lowStockVariants.map((v) => (
              <li
                key={v.variant.id}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-pt-ink">
                    {v.productTitle}
                  </div>
                  <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
                    {v.variant.sku} ({v.variant.label})
                  </div>
                </div>
                <Badge tone={v.variant.stock <= 5 ? "danger" : "amber"}>
                  {v.variant.stock} in stock
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
