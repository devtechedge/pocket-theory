import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { ProductDetailView } from "@/domains/catalog/service";
import type { CompatibilityItem, SpecVerificationNote } from "@/db/schema";

const VERIFICATION_LABELS: Record<
  SpecVerificationNote,
  { label: string; tone: BadgeTone }
> = {
  VERIFIED_LAB: { label: "Verified Lab Sheet", tone: "lime" },
  DESIGN_TARGET: { label: "Design Target", tone: "cobalt" },
  ILLUSTRATIVE_DEMO: { label: "Illustrative Demo", tone: "neutral" },
  PENDING_VERIFICATION: { label: "Pending Verification", tone: "amber" },
};

const COMPAT_TONE: Record<CompatibilityItem["status"], BadgeTone> = {
  COMPATIBLE: "lime",
  PARTIAL: "amber",
  NOT_COMPATIBLE: "danger",
  PENDING_VERIFICATION: "cobalt",
};

export function ProductSpecsPanel({ product }: { product: ProductDetailView }) {
  return (
    <div className="space-y-10">
      {/* Editorial Overview separated from Technical Spec Matrix */}
      <section aria-labelledby="overview-heading">
        <h2
          id="overview-heading"
          className="font-display text-lg font-bold text-pt-ink"
        >
          Overview & Intended Use
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-pt-ink-muted">
          {product.description}
        </p>
      </section>

      {/* Technical Specification Matrix */}
      <section aria-labelledby="specs-matrix-heading" className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2
            id="specs-matrix-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            Technical Specification Matrix
          </h2>
          <p className="font-mono text-xs text-pt-ink-muted">
            Demo values editable by owner upon supplier lab verification
          </p>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="Technical specifications table"
          className="mt-3 overflow-x-auto rounded-lg border border-pt-border bg-pt-surface-elevated"
        >
          <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-pt-border bg-pt-surface font-mono uppercase text-pt-ink-muted">
                <th className="px-4 py-2.5">Domain</th>
                <th className="px-4 py-2.5">Parameter</th>
                <th className="px-4 py-2.5">Specification</th>
                <th className="px-4 py-2.5">Evidence State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pt-border">
              {product.specs.map((s) => {
                const badgeMeta = VERIFICATION_LABELS[s.verificationNote];
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-pt-ink">
                      {s.specGroup}
                    </td>
                    <td className="px-4 py-3 font-medium text-pt-ink">
                      {s.specKey}
                    </td>
                    <td className="px-4 py-3 text-pt-ink-muted">
                      {s.specValue}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={badgeMeta.tone}>{badgeMeta.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="px-4 py-3 font-mono font-semibold text-pt-ink">
                  Envelope
                </td>
                <td className="px-4 py-3 font-medium text-pt-ink">
                  Dimensions & Weight
                </td>
                <td className="px-4 py-3 text-pt-ink-muted">
                  {product.dimensionsMm ?? "Pending measurement"} |{" "}
                  {product.weightGrams != null
                    ? `~${product.weightGrams} g`
                    : "Pending mass check"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">Illustrative Demo</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Compatibility Matrix & Box Contents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="compatibility-heading"
          className="min-w-0 lg:col-span-7"
        >
          <h2
            id="compatibility-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            Device Compatibility Notes
          </h2>
          <ul className="mt-3 space-y-2.5">
            {product.compatibility.map((c) => (
              <li
                key={c.deviceClass}
                className="rounded-lg border border-pt-border bg-pt-surface-elevated p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-pt-ink">
                    {c.deviceClass}
                  </span>
                  <Badge tone={COMPAT_TONE[c.status]}>
                    {c.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-pt-ink-muted">
                  {c.note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="box-contents-heading"
          className="min-w-0 lg:col-span-5"
        >
          <h2
            id="box-contents-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            In the Retail Box
          </h2>
          <ul className="mt-3 divide-y divide-pt-border rounded-lg border border-pt-border bg-pt-surface-elevated">
            {product.boxContents.map((item, idx) => (
              <li
                key={item}
                className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-pt-ink"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-pt-tangerine-soft font-mono text-[0.6875rem] font-bold text-pt-tangerine-ink">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
