import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PaginationBar } from "@/components/catalog/PaginationBar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ShopFilters } from "@/components/catalog/ShopFilters";
import {
  listCategoriesWithCounts,
  queryCatalog,
  type CatalogSort,
} from "@/domains/catalog/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All 40 Hardware SKUs",
  description:
    "Browse and filter all 40 POCKET THEORY personal electronics across power banks, GaN chargers, earbuds, smartwatches, workspace hubs, and automotive tools.",
  alternates: { canonical: "/shop" },
};

function firstParam(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = firstParam(raw.q);
  const category = firstParam(raw.category);
  const collection = firstParam(raw.collection);
  const minPriceStr = firstParam(raw.minPrice);
  const maxPriceStr = firstParam(raw.maxPrice);
  const inStock = firstParam(raw.inStock) === "1";
  const under999 = firstParam(raw.under999) === "1";
  const sort = (firstParam(raw.sort) as CatalogSort | undefined) ?? "featured";
  const page = Math.max(1, Number.parseInt(firstParam(raw.page) ?? "1", 10) || 1);

  const [categories, result] = await Promise.all([
    listCategoriesWithCounts(),
    queryCatalog({
      q,
      categorySlug: category,
      collectionSlug: collection,
      minPriceRupees: minPriceStr ? Number(minPriceStr) : undefined,
      maxPriceRupees: maxPriceStr ? Number(maxPriceStr) : undefined,
      inStockOnly: inStock,
      under999,
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold tracking-wider text-pt-cobalt uppercase">
            POCKET THEORY // Hardware Catalogue
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
            {q ? `Results for "${q}"` : "All Hardware & Everyday Gadgets"}
          </h1>
        </div>
        <p
          data-testid="shop-result-count"
          className="font-mono text-xs font-bold text-pt-ink-muted"
        >
          Showing {result.items.length} of {result.total} matching SKUs
        </p>
      </div>

      <Suspense fallback={null}>
        <ShopFilters categories={categories} basePath="/shop" />
      </Suspense>

      {result.items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-pt-border bg-pt-surface-elevated p-10 text-center">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            No matching gadgets for those filters.
          </h2>
          <p className="mt-2 text-sm text-pt-ink-muted">
            Try clearing the price band or searching by core spec (for example
            &ldquo;65W&rdquo;, &ldquo;ANC&rdquo;, &ldquo;USB-C&rdquo;, or
            &ldquo;vacuum&rdquo;).
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-pt-tangerine px-5 text-sm font-semibold text-pt-on-tangerine"
          >
            View All 40 Products
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((item, idx) => (
              <ProductCard
                key={item.id}
                product={item}
                priority={idx < 4}
              />
            ))}
          </div>

          <PaginationBar
            page={result.page}
            totalPages={result.totalPages}
            basePath="/shop"
            currentParams={{
              q,
              category,
              collection,
              minPrice: minPriceStr,
              maxPrice: maxPriceStr,
              inStock: inStock ? "1" : undefined,
              under999: under999 ? "1" : undefined,
              sort: sort !== "featured" ? sort : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}
