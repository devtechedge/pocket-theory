import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { InventoryAdjustRow } from "@/components/admin/InventoryAdjustRow";
import { Badge } from "@/components/ui/Badge";
import { getDb } from "@/db/client";
import { inventoryMovements, products, productVariants } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Inventory Ledger",
  robots: { index: false, follow: false },
};

export default async function AdminInventoryPage() {
  const actor = await requirePageCapability("MANAGE_INVENTORY");
  const db = await getDb();

  const [variantRows, recentMovements] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        label: productVariants.label,
        stock: productVariants.stock,
        lowStockThreshold: productVariants.lowStockThreshold,
        productTitle: products.title,
        catalogIndex: products.catalogIndex,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .orderBy(asc(products.catalogIndex)),
    db
      .select({
        mov: inventoryMovements,
        sku: productVariants.sku,
      })
      .from(inventoryMovements)
      .innerJoin(
        productVariants,
        eq(inventoryMovements.variantId, productVariants.id),
      )
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(18),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <h1 className="font-display text-2xl font-bold text-pt-ink">
        SKU & Variant Inventory Console
      </h1>
      <p className="mt-1 text-xs text-pt-ink-muted">
        Every manual stock intake, damage write-off, and order reservation
        writes an immutable ledger row.
      </p>

      <div
        tabIndex={0}
        role="region"
        aria-label="Variant stock levels table"
        className="mt-5 overflow-x-auto rounded-xl border border-pt-border bg-pt-surface-elevated"
      >
        <table className="w-full min-w-[46rem] text-left text-xs">
          <thead>
            <tr className="border-b border-pt-border bg-pt-surface font-mono uppercase text-pt-ink-muted">
              <th className="px-4 py-3">Product & Variant SKU</th>
              <th className="px-4 py-3">On-Hand Stock</th>
              <th className="px-4 py-3">Audited Adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pt-border">
            {variantRows.map((v) => (
              <InventoryAdjustRow key={v.id} variant={v} />
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-xl border border-pt-border bg-pt-surface-elevated p-5">
        <h2 className="font-display text-base font-bold text-pt-ink">
          Recent Stock Movements Ledger
        </h2>
        <ul className="mt-3 divide-y divide-pt-border text-xs">
          {recentMovements.map((m) => (
            <li
              key={m.mov.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div>
                <span className="font-mono font-bold text-pt-cobalt">
                  {m.sku}
                </span>{" "}
                - <span className="text-pt-ink">{m.mov.note ?? m.mov.reason}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Badge tone={m.mov.delta >= 0 ? "lime" : "amber"}>
                  {m.mov.delta >= 0 ? `+${m.mov.delta}` : m.mov.delta}
                </Badge>
                <span className="text-pt-ink-muted">
                  Bal: {m.mov.balanceAfter}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
