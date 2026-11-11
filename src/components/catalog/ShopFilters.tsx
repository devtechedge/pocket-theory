"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { CatalogSort } from "@/domains/catalog/service";

interface CategoryOption {
  slug: string;
  name: string;
  productCount: number;
}

const PRICE_BANDS: ReadonlyArray<{
  label: string;
  min?: string;
  max?: string;
}> = [
  { label: "All Prices" },
  { label: "Under ₹999", max: "999" },
  { label: "₹1,000 - ₹1,999", min: "1000", max: "1999" },
  { label: "₹2,000 - ₹2,999", min: "2000", max: "2999" },
  { label: "₹3,000 & above", min: "3000" },
];

export function ShopFilters({
  categories,
  basePath = "/shop",
}: {
  categories: CategoryOption[];
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCat = searchParams.get("category") ?? "all";
  const activeSort = (searchParams.get("sort") as CatalogSort) ?? "featured";
  const inStock = searchParams.get("inStock") === "1";
  const under999 = searchParams.get("under999") === "1";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const q = searchParams.get("q") ?? "";

  function updateParams(mutator: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutator(next);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  return (
    <div
      data-testid="shop-filters"
      className={`rounded-lg border border-pt-border bg-pt-surface-elevated p-4 ${
        isPending ? "opacity-75" : ""
      }`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Category select */}
        {basePath === "/shop" && (
          <div>
            <label
              htmlFor="filter-category"
              className="block font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={activeCat}
              onChange={(e) =>
                updateParams((p) => {
                  if (e.target.value === "all") p.delete("category");
                  else p.set("category", e.target.value);
                })
              }
              className="mt-1.5 h-9 w-full rounded-md border border-pt-border bg-pt-surface px-2.5 text-xs font-medium text-pt-ink"
            >
              <option value="all">All Categories (40)</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.productCount})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price band select */}
        <div>
          <label
            htmlFor="filter-price-band"
            className="block font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase"
          >
            Price Band (INR)
          </label>
          <select
            id="filter-price-band"
            value={`${minPrice}-${maxPrice}`}
            onChange={(e) => {
              const [minV, maxV] = e.target.value.split("-");
              updateParams((p) => {
                p.delete("under999");
                if (minV) p.set("minPrice", minV);
                else p.delete("minPrice");
                if (maxV) p.set("maxPrice", maxV);
                else p.delete("maxPrice");
              });
            }}
            className="mt-1.5 h-9 w-full rounded-md border border-pt-border bg-pt-surface px-2.5 text-xs font-medium text-pt-ink"
          >
            {PRICE_BANDS.map((b) => {
              const val = `${b.min ?? ""}-${b.max ?? ""}`;
              return (
                <option key={b.label} value={val}>
                  {b.label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Sort select */}
        <div>
          <label
            htmlFor="filter-sort"
            className="block font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase"
          >
            Sort By
          </label>
          <select
            id="filter-sort"
            value={activeSort}
            onChange={(e) =>
              updateParams((p) => {
                if (e.target.value === "featured") p.delete("sort");
                else p.set("sort", e.target.value);
              })
            }
            className="mt-1.5 h-9 w-full rounded-md border border-pt-border bg-pt-surface px-2.5 text-xs font-medium text-pt-ink"
          >
            <option value="featured">Featured & Curated</option>
            <option value="index-asc">Catalogue #01 - #40</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">New Drops First</option>
          </select>
        </div>

        {/* Quick attribute checkboxes */}
        <div className="flex flex-wrap items-end gap-3 pt-1">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-pt-border bg-pt-surface px-3 text-xs font-semibold text-pt-ink">
            <input
              type="checkbox"
              checked={under999}
              onChange={(e) =>
                updateParams((p) => {
                  if (e.target.checked) p.set("under999", "1");
                  else p.delete("under999");
                })
              }
              className="h-3.5 w-3.5 accent-pt-tangerine"
            />
            <span>Under ₹999</span>
          </label>

          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-pt-border bg-pt-surface px-3 text-xs font-semibold text-pt-ink">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) =>
                updateParams((p) => {
                  if (e.target.checked) p.set("inStock", "1");
                  else p.delete("inStock");
                })
              }
              className="h-3.5 w-3.5 accent-pt-tangerine"
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {(q || activeCat !== "all" || under999 || inStock || minPrice || maxPrice) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-pt-border pt-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-pt-ink-muted">
            <span>Active filters:</span>
            {q && (
              <span className="rounded bg-pt-paper px-2 py-0.5 text-pt-ink">
                Query: &ldquo;{q}&rdquo;
              </span>
            )}
            {activeCat !== "all" && (
              <span className="rounded bg-pt-paper px-2 py-0.5 text-pt-ink">
                {activeCat}
              </span>
            )}
            {under999 && (
              <span className="rounded bg-pt-tangerine-soft px-2 py-0.5 text-pt-tangerine-ink">
                ≤ ₹999
              </span>
            )}
            {inStock && (
              <span className="rounded bg-pt-lime-soft px-2 py-0.5 text-pt-lime-ink">
                In Stock
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="font-mono text-xs font-semibold text-pt-cobalt hover:underline"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
