import type { Metadata } from "next";
import { CompareTable } from "@/components/compare/CompareTable";
import {
  getComparisonProductsBySlugs,
  queryCatalog,
} from "@/domains/catalog/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Hardware Specifications",
  description:
    "Side-by-side comparison of 2 to 4 POCKET THEORY personal electronics with aligned specifications and explicit missing-data markers.",
  alternates: { canonical: "/compare" },
};

const DEFAULT_COMPARE_SLUGS = [
  "voltcore-65w-dual-port-gan-wall-charger",
  "voltcore-33w-dual-port-fast-charger",
  "minivolt-20w-usb-c-pd-charger",
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ skus?: string }>;
}) {
  const { skus } = await searchParams;
  const requestedSlugs = skus
    ? skus
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_COMPARE_SLUGS;

  const [items, allCatalog] = await Promise.all([
    getComparisonProductsBySlugs(requestedSlugs),
    queryCatalog({ sort: "index-asc", pageSize: 48 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Side-by-Side Matrix // Up to 4 SKUs
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
          Hardware Comparison Bench
        </h1>
        <p className="mt-1 text-sm text-pt-ink-muted">
          Aligned technical specifications, physical dimensions, regulatory
          applicability, and explicit markers wherever a parameter does not
          apply or awaits batch verification.
        </p>
      </div>

      <CompareTable items={items} allOptions={allCatalog.items} />
    </div>
  );
}
