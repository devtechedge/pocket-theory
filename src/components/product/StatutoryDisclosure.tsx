import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { ProductDetailView } from "@/domains/catalog/service";
import { formatPaise } from "@/lib/money";

export function StatutoryDisclosure({
  product,
}: {
  product: ProductDetailView;
}) {
  return (
    <section
      aria-labelledby="statutory-heading"
      data-testid="pdp-statutory-panel"
      className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-pt-border pb-4">
        <div>
          <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
            Legal Metrology (Packaged Commodities) & Consumer Safety Disclosures
          </p>
          <h2
            id="statutory-heading"
            className="mt-1 font-display text-lg font-bold text-pt-ink"
          >
            Statutory Packaging, Regulatory & Safety Record
          </h2>
        </div>
        <Link
          href="/product-safety"
          className="font-mono text-xs font-bold text-pt-tangerine hover:underline"
        >
          Full Safety & E-Waste Rules →
        </Link>
      </div>

      {/* Safety callout */}
      <div className="mt-4 flex items-start gap-2.5 rounded-md border border-pt-amber-ink/25 bg-pt-amber-soft p-3.5 text-xs text-pt-amber-ink">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">Usage, Thermal & Battery Safety Note</p>
          <p className="mt-0.5 leading-relaxed">{product.safetyNotes}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Common / Generic Name
          </dt>
          <dd className="mt-0.5 font-semibold text-pt-ink">
            {product.genericName}
          </dd>
        </div>

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Model Number & Net Quantity
          </dt>
          <dd className="mt-0.5 font-mono font-semibold text-pt-ink">
            {product.modelNumber} | Net Qty: {product.netQuantity}
          </dd>
        </div>

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Maximum Retail Price (MRP)
          </dt>
          <dd className="mt-0.5 font-mono font-semibold text-pt-ink">
            {formatPaise(product.mrpPaise)} (Inclusive of all taxes - HSN{" "}
            {product.hsnCode})
          </dd>
        </div>

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Country of Origin
          </dt>
          <dd className="mt-0.5 text-pt-ink">{product.countryOfOrigin}</dd>
        </div>

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            BIS Compulsory Registration (CRS)
          </dt>
          <dd className="mt-0.5 text-pt-ink">
            {product.requiresBisCrs
              ? `Applicable (${product.bisStandardRef ?? "IS/IEC 62368-1"}) - Registration Ref: ${
                  product.bisRegistrationNumber ??
                  "Pending supplier R-number verification (not claimed in demo)"
                }`
              : product.bisStandardRef ?? "Not a standalone CRS mains/battery category"}
          </dd>
        </div>

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            WPC Equipment Type Approval (ETA)
          </dt>
          <dd className="mt-0.5 text-pt-ink">
            {product.requiresWpcEta
              ? `Applicable (2.4 GHz / Inductive RF) - ETA Ref: ${
                  product.wpcEtaNumber ??
                  "Pending RF test & ETA verification (not claimed in demo)"
                }`
              : "Non-radio wired/passive hardware (WPC ETA not applicable)"}
          </dd>
        </div>

        {product.batteryWhRating && (
          <div className="border-b border-pt-border pb-2.5 sm:col-span-2">
            <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
              Battery & E-Waste Take-Back Note
            </dt>
            <dd className="mt-0.5 text-pt-ink">
              {product.batteryWhRating}. Do not dispose of batteries or
              electronic equipment in household municipal waste; hand over at
              authorized CPCB e-waste/battery collection centres.
            </dd>
          </div>
        )}

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Manufacturer / Packer
          </dt>
          <dd className="mt-0.5 text-pt-ink-muted">
            {product.manufacturerDetails}
          </dd>
        </div>

        <div className="border-b border-pt-border pb-2.5">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Marketed / Imported By
          </dt>
          <dd className="mt-0.5 text-pt-ink-muted">
            {product.importerDetails}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
            Customer Care & Grievance Contact
          </dt>
          <dd className="mt-0.5 text-pt-ink-muted">
            {product.customerCareContact}
          </dd>
        </div>
      </dl>
    </section>
  );
}
