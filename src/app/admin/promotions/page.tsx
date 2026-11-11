import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { CouponManager } from "@/components/admin/CouponManager";
import { getDb } from "@/db/client";
import { coupons, shippingRules } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Coupons, Shipping & Tax",
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  const actor = await requirePageCapability("MANAGE_PROMOTIONS");
  const db = await getDb();

  const [couponRows, shippingRows] = await Promise.all([
    db.select().from(coupons).orderBy(desc(coupons.createdAt)),
    db.select().from(shippingRules),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <h1 className="mb-5 font-display text-2xl font-bold text-pt-ink">
        Coupons, Shipping Thresholds & GST Configuration
      </h1>

      <CouponManager coupons={couponRows} />

      <section className="mt-8 rounded-xl border border-pt-border bg-pt-surface-elevated p-5 text-xs">
        <h2 className="font-display text-base font-bold text-pt-ink">
          Active Indian Shipping Tiers & GST Dispatch Origin
        </h2>
        <p className="mt-1 text-pt-ink-muted">
          Dispatch State: <strong>Maharashtra (GST State Code 27)</strong> - 9%
          CGST + 9% SGST intra-state; 18% IGST inter-state.
        </p>
        <ul className="mt-3 divide-y divide-pt-border">
          {shippingRows.map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between py-2.5">
              <span>
                <strong>{s.label}</strong> ({s.code}) - {s.estimatedDaysMin}-
                {s.estimatedDaysMax} business days
              </span>
              <span className="font-mono">
                Base fee {formatPaise(s.baseFeePaise)} | Free ≥{" "}
                {formatPaise(s.freeThresholdPaise)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
