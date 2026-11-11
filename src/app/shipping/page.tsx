import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & PIN Delivery Policy",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-pt-ink-muted">
        <h1 className="font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          Shipping & Indian PIN Coverage Policy
        </h1>
        <p>
          <strong>Dispatch Origin:</strong> Mumbai, Maharashtra (PIN 400013, GST
          State Code 27). Note: In this reference deployment, no live carrier
          API (Delhivery/BlueDart) is claimed; tracking numbers entered in the
          Admin Console are manual operational records.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-xs">
          <li>
            <strong>Standard Insured Dispatch:</strong> FREE on cart totals ≥
            ₹999 after promo discounts; ₹79 flat fee below ₹999. Estimated 1-2
            business days in Mumbai/Pune, 2-4 business days in Tier-1 metros,
            and 4-7 business days in regional postal circles.
          </li>
          <li>
            <strong>Priority Metro Dispatch:</strong> ₹149 (FREE on orders ≥
            ₹4,999), 1-3 business days for non-lithium items.
          </li>
          <li>
            <strong>Lithium Power Bank Ground Routing:</strong> Power banks and
            internal lithium cell packs travel by DGCA-compliant surface linehaul
            outside Maharashtra and cannot be air-shipped to island PIN codes
            (744xxx).
          </li>
        </ul>
      </div>
    </div>
  );
}
