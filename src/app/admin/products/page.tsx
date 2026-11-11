import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { categories, products, productVariants } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const actor = await requirePageCapability("MANAGE_CATALOG");
  const db = await getDb();

  const [prodRows, catRows, varRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.catalogIndex)),
    db.select().from(categories),
    db.select().from(productVariants),
  ]);

  const catMap = new Map(catRows.map((c) => [c.id, c.name]));
  const stockByProd = new Map<string, number>();
  for (const v of varRows) {
    stockByProd.set(v.productId, (stockByProd.get(v.productId) ?? 0) + v.stock);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-pt-ink">
            Catalogue & Compliance Gate ({prodRows.length} SKUs)
          </h1>
          <p className="text-xs text-pt-ink-muted">
            Edit prices, copy, Legal Metrology declarations, or publish state.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center rounded-md bg-pt-tangerine px-4 text-xs font-semibold text-pt-on-tangerine"
        >
          + New Draft SKU
        </Link>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="Admin catalogue products table"
        className="overflow-x-auto rounded-xl border border-pt-border bg-pt-surface-elevated"
      >
        <table className="w-full min-w-[48rem] text-left text-xs">
          <thead>
            <tr className="border-b border-pt-border bg-pt-surface font-mono uppercase text-pt-ink-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">SKU & Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pt-border">
            {prodRows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-mono font-bold">
                  {String(p.catalogIndex).padStart(2, "0")}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-pt-ink">{p.title}</div>
                  <div className="font-mono text-[0.6875rem] text-pt-cobalt">
                    {p.sku}
                  </div>
                </td>
                <td className="px-4 py-3 text-pt-ink-muted">
                  {catMap.get(p.categoryId) ?? p.categoryId}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  {formatPaise(p.pricePaise)}
                </td>
                <td className="px-4 py-3 font-mono">
                  {stockByProd.get(p.id) ?? 0}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      p.complianceStatus === "VERIFIED"
                        ? "lime"
                        : p.complianceStatus === "DEMO_ILLUSTRATIVE"
                          ? "amber"
                          : "danger"
                    }
                  >
                    {p.complianceStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.status === "ACTIVE" ? "cobalt" : "neutral"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    data-testid={`admin-edit-${p.slug}`}
                    className="font-mono font-bold text-pt-tangerine hover:underline"
                  >
                    Edit →
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
