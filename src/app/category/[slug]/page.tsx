import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ShopFilters } from "@/components/catalog/ShopFilters";
import {
  listCategoriesWithCounts,
  queryCatalog,
  type CatalogSort,
} from "@/domains/catalog/service";
import { getSiteUrl } from "@/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cats = await listCategoriesWithCounts();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) {
    return { title: "Category" };
  }
  return {
    title: `${cat.name} (${cat.productCount} SKUs)`,
    description: cat.description,
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export default async function CategoryCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const cats = await listCategoriesWithCounts();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();

  const sort =
    ((Array.isArray(raw.sort) ? raw.sort[0] : raw.sort) as
      | CatalogSort
      | undefined) ?? "featured";
  const under999 =
    (Array.isArray(raw.under999) ? raw.under999[0] : raw.under999) === "1";
  const inStock =
    (Array.isArray(raw.inStock) ? raw.inStock[0] : raw.inStock) === "1";
  const minPrice = Array.isArray(raw.minPrice) ? raw.minPrice[0] : raw.minPrice;
  const maxPrice = Array.isArray(raw.maxPrice) ? raw.maxPrice[0] : raw.maxPrice;

  const result = await queryCatalog({
    categorySlug: slug,
    sort,
    under999,
    inStockOnly: inStock,
    minPriceRupees: minPrice ? Number(minPrice) : undefined,
    maxPriceRupees: maxPrice ? Number(maxPrice) : undefined,
    pageSize: 40,
  });

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.name} | POCKET THEORY`,
    description: cat.description,
    url: `${siteUrl}/category/${cat.slug}`,
    numberOfItems: result.total,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 font-mono text-xs text-pt-ink-muted">
        <Link href="/" className="hover:text-pt-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/shop" className="hover:text-pt-ink">
          Shop
        </Link>{" "}
        / <span className="text-pt-ink">{cat.name}</span>
      </nav>

      <div className="mb-6 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6">
        <p className="font-mono text-xs font-bold text-pt-tangerine uppercase">
          Category Shelf // {cat.productCount} Active SKUs
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
          {cat.name}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-pt-ink-muted">
          {cat.description}
        </p>
      </div>

      <Suspense fallback={null}>
        <ShopFilters categories={cats} basePath={`/category/${cat.slug}`} />
      </Suspense>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
}
