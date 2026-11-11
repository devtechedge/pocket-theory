import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoryMerchRow } from "@/components/admin/CategoryMerchRow";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { categories, products } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Categories & Merchandising",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const actor = await requirePageCapability("MANAGE_CATALOG");
  const db = await getDb();

  const [catRows, boostedProds] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(products).orderBy(desc(products.searchBoost)).limit(10),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <h1 className="font-display text-2xl font-bold text-pt-ink">
        Categories, Collections & Search Merchandising
      </h1>

      <section className="mt-5 space-y-2.5 rounded-xl border border-pt-border bg-pt-surface-elevated p-5">
        <h2 className="font-display text-base font-bold text-pt-ink">
          Storefront Category Shelves
        </h2>
        {catRows.map((c) => (
          <CategoryMerchRow key={c.id} category={c} />
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-pt-border bg-pt-surface-elevated p-5">
        <h2 className="font-display text-base font-bold text-pt-ink">
          Search Boost & Featured Pinning Leaderboard
        </h2>
        <ul className="mt-3 divide-y divide-pt-border text-xs">
          {boostedProds.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div>
                <span className="font-semibold text-pt-ink">{p.title}</span>{" "}
                <span className="font-mono text-pt-ink-muted">({p.sku})</span>
              </div>
              <div className="flex items-center gap-2">
                {p.isFeatured && <Badge tone="tangerine">Featured</Badge>}
                {p.isNewDrop && <Badge tone="cobalt">New Drop</Badge>}
                <Badge tone="neutral">Boost +{p.searchBoost}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
