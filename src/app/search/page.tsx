import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { queryCatalog } from "@/domains/catalog/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Hardware & Specs",
  description:
    "Search POCKET THEORY gadgets by wattage, connector, acoustic profile, or SKU.",
  alternates: { canonical: "/search" },
};

const QUICK_SEARCHES = [
  "65W",
  "Power Bank",
  "ANC",
  "240W",
  "USB-C Hub",
  "Mechanical Keyboard",
  "Vacuum",
  "Dash Camera",
  "Tyre Inflator",
  "Tracker",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const trimmed = q.trim();
  const results = await queryCatalog({
    q: trimmed || undefined,
    sort: "featured",
    pageSize: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-6">
        <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Specification & SKU Lookup
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
          Search Pocket Theory
        </h1>

        <form action="/search" method="get" className="mt-4 flex flex-wrap gap-2">
          <label htmlFor="dedicated-search-input" className="sr-only">
            Search catalogue
          </label>
          <input
            id="dedicated-search-input"
            name="q"
            type="search"
            defaultValue={trimmed}
            placeholder="Try '65W GaN', 'Open-Ear', '12V', 'PT-PWR-003'..."
            className="h-11 min-w-0 flex-1 rounded-md border border-pt-border-strong bg-pt-surface px-4 text-sm text-pt-ink"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-md bg-pt-tangerine px-5 text-sm font-semibold text-pt-on-tangerine hover:bg-pt-tangerine-hover"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-pt-ink-muted">
            Popular queries:
          </span>
          {QUICK_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="rounded border border-pt-border bg-pt-surface px-2.5 py-1 font-mono text-xs text-pt-ink hover:border-pt-tangerine"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-pt-ink">
          {trimmed
            ? `${results.total} results for "${trimmed}"`
            : "Featured Catalogue Picks"}
        </h2>

        {results.items.length === 0 ? (
          <div className="mt-4 rounded-lg border border-pt-border bg-pt-surface-elevated p-8 text-center">
            <p className="text-sm font-semibold text-pt-ink">
              Zero hardware matches for &ldquo;{trimmed}&rdquo;.
            </p>
            <p className="mt-1 text-xs text-pt-ink-muted">
              Check spelling, search a broader term (such as &ldquo;charger&rdquo;
              or &ldquo;audio&rdquo;), or browse all 5 categories below.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/shop"
                className="rounded-md bg-pt-ink px-4 py-2 text-xs font-semibold text-pt-surface-elevated"
              >
                Browse All 40 SKUs
              </Link>
              <Link
                href="/guides"
                className="rounded-md border border-pt-border px-4 py-2 text-xs font-semibold text-pt-ink"
              >
                Buying Guides
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
