"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PackshotImage } from "@/components/ui/PackshotImage";
import type {
  CatalogCardItem,
  ProductDetailView,
} from "@/domains/catalog/service";
import { formatPaise } from "@/lib/money";

export function CompareTable({
  items,
  allOptions,
}: {
  items: ProductDetailView[];
  allOptions: CatalogCardItem[];
}) {
  const router = useRouter();
  const { addToCart, removeCompare } = useStorefront();

  const currentSlugs = items.map((i) => i.slug);

  function pushNextSlugs(nextSlugs: string[]) {
    const clean = Array.from(new Set(nextSlugs)).slice(0, 4);
    if (clean.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?skus=${encodeURIComponent(clean.join(","))}`);
    }
  }

  // Collect union of all distinct spec keys in display order
  const allSpecKeys: string[] = [];
  for (const item of items) {
    for (const s of item.specs) {
      const composite = `${s.specGroup} // ${s.specKey}`;
      if (!allSpecKeys.includes(composite)) {
        allSpecKeys.push(composite);
      }
    }
  }

  const remainingOptions = allOptions.filter(
    (opt) => !currentSlugs.includes(opt.slug),
  );

  return (
    <div className="space-y-6">
      {/* Add / Preset Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pt-border bg-pt-surface-elevated p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="compare-add-select"
            className="font-mono text-xs font-bold text-pt-ink uppercase"
          >
            Add SKU ({items.length}/4):
          </label>
          <select
            id="compare-add-select"
            disabled={items.length >= 4}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                pushNextSlugs([...currentSlugs, e.target.value]);
              }
            }}
            className="h-9 max-w-xs rounded-md border border-pt-border-strong bg-pt-surface px-3 text-xs text-pt-ink disabled:opacity-50"
          >
            <option value="">
              {items.length >= 4
                ? "Maximum 4 items selected"
                : "Select a gadget to add..."}
            </option>
            {remainingOptions.map((o) => (
              <option key={o.slug} value={o.slug}>
                #{String(o.catalogIndex).padStart(2, "0")} {o.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-pt-ink-muted">Quick sets:</span>
          <Link
            href="/compare?skus=pocketcell-10k-22-5w-usb-c-power-bank,pocketcell-20k-22-5w-dual-output-power-bank,pocketcell-pro-20k-65w-laptop-power-bank"
            className="rounded border border-pt-border bg-pt-surface px-2.5 py-1 text-pt-cobalt hover:underline"
          >
            Power Banks
          </Link>
          <Link
            href="/compare?skus=airbeat-pro-anc-true-wireless-earbuds,airbeat-game-low-latency-gaming-earbuds,airbeat-open-ear-sport-earbuds"
            className="rounded border border-pt-border bg-pt-surface px-2.5 py-1 text-pt-cobalt hover:underline"
          >
            Earbuds
          </Link>
          <Link
            href="/compare?skus=voltcore-65w-dual-port-gan-wall-charger,voltcore-33w-dual-port-fast-charger,minivolt-20w-usb-c-pd-charger"
            className="rounded border border-pt-border bg-pt-surface px-2.5 py-1 text-pt-cobalt hover:underline"
          >
            Wall Chargers
          </Link>
        </div>
      </div>

      {items.length < 2 ? (
        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-10 text-center">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            Select at least 2 gadgets to compare side by side.
          </h2>
          <p className="mt-2 text-xs text-pt-ink-muted">
            Pick from the selector above, use a quick set, or tap the scale icon
            on any product card.
          </p>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Side-by-side hardware specification comparison"
          data-testid="compare-matrix-table"
          className="overflow-x-auto rounded-xl border border-pt-border-strong bg-pt-surface-elevated"
        >
          <table className="w-full min-w-[44rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-pt-border bg-pt-surface align-top">
                <th className="w-48 px-4 py-4 font-mono text-xs font-bold text-pt-ink-muted uppercase">
                  Specification
                </th>
                {items.map((item) => (
                  <th key={item.id} className="min-w-[13rem] px-4 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[0.6875rem] text-pt-cobalt">
                        {item.sku}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          removeCompare(item.slug);
                          pushNextSlugs(
                            currentSlugs.filter((s) => s !== item.slug),
                          );
                        }}
                        aria-label={`Remove ${item.title}`}
                        className="rounded p-1 text-pt-ink-muted hover:bg-pt-silver hover:text-pt-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 aspect-[4/3] w-full overflow-hidden rounded-md border border-pt-border bg-pt-paper">
                      <PackshotImage
                        src={item.primaryImage.url}
                        alt={item.primaryImage.alt}
                      />
                    </div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="mt-2.5 block font-display text-sm font-bold text-pt-ink hover:text-pt-tangerine"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-extrabold text-pt-ink">
                        {formatPaise(item.pricePaise)}
                      </span>
                      <Button
                        size="sm"
                        disabled={item.totalStock <= 0}
                        onClick={() => addToCart(item.defaultVariantId, 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pt-border">
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  Category
                </td>
                {items.map((item) => (
                  <td key={item.id} className="px-4 py-3 text-pt-ink">
                    {item.categoryName}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  MRP (Incl. GST)
                </td>
                {items.map((item) => (
                  <td key={item.id} className="px-4 py-3 font-mono text-pt-ink-muted">
                    {formatPaise(item.mrpPaise)} (HSN {item.hsnCode})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  Stock & Finishes
                </td>
                {items.map((item) => (
                  <td key={item.id} className="px-4 py-3 text-pt-ink">
                    {item.totalStock} units across {item.variants.length}{" "}
                    {item.variants.length === 1 ? "finish" : "finishes"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  Dimensions & Mass
                </td>
                {items.map((item) => (
                  <td key={item.id} className="px-4 py-3 text-pt-ink-muted">
                    {item.dimensionsMm ?? "Not specified"} |{" "}
                    {item.weightGrams != null
                      ? `~${item.weightGrams} g`
                      : "Pending mass verification"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  Warranty & Return
                </td>
                {items.map((item) => (
                  <td key={item.id} className="px-4 py-3 text-pt-ink">
                    {item.warrantyMonths} months warranty /{" "}
                    {item.returnWindowDays}-day return window
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-pt-ink">
                  Regulatory Scope
                </td>
                {items.map((item) => (
                  <td key={item.id} className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={item.requiresBisCrs ? "amber" : "neutral"}>
                        {item.requiresBisCrs ? "BIS CRS Scope" : "No BIS CRS"}
                      </Badge>
                      <Badge tone={item.requiresWpcEta ? "cobalt" : "neutral"}>
                        {item.requiresWpcEta ? "WPC ETA RF" : "Non-RF"}
                      </Badge>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Aligned Technical Spec Rows with Explicit Missing-Field State */}
              {allSpecKeys.map((compositeKey) => (
                <tr key={compositeKey}>
                  <td className="px-4 py-3 font-mono font-semibold text-pt-ink">
                    {compositeKey}
                  </td>
                  {items.map((item) => {
                    const match = item.specs.find(
                      (s) => `${s.specGroup} // ${s.specKey}` === compositeKey,
                    );
                    if (!match) {
                      return (
                        <td
                          key={item.id}
                          className="px-4 py-3 font-mono text-pt-ink-muted italic"
                        >
                          Not applicable / not reported for this SKU
                        </td>
                      );
                    }
                    return (
                      <td key={item.id} className="px-4 py-3 text-pt-ink">
                        <div>{match.specValue}</div>
                        {match.verificationNote === "PENDING_VERIFICATION" && (
                          <span className="mt-1 inline-block font-mono text-[0.65rem] text-pt-amber-ink">
                            [Pending verification]
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
