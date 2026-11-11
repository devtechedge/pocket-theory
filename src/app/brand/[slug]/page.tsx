import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { queryCatalog } from "@/domains/catalog/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== "pocket-theory") return { title: "Brand" };
  return {
    title: "POCKET THEORY House Brand Standard",
    description:
      "Single-merchant Indian personal electronics brand standard: 40 house SKUs, transparent specification status, and Legal Metrology compliance.",
    alternates: { canonical: "/brand/pocket-theory" },
  };
}

export default async function BrandCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "pocket-theory") notFound();

  const catalog = await queryCatalog({ sort: "index-asc", pageSize: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8">
        <Badge tone="tangerine">Single-Merchant House Label</Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-pt-ink sm:text-4xl">
          POCKET THEORY
        </h1>
        <p className="mt-2 font-mono text-xs font-bold text-pt-cobalt uppercase">
          &ldquo;Useful tech. Zero fuss.&rdquo; // Mumbai, Maharashtra (INR)
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-pt-ink-muted">
          Every SKU in this store carries the POCKET THEORY house mark rather
          than aggregating unvetted third-party marketplace sellers. Spec sheets
          distinguish verified physical measurements from lab parameters pending
          batch verification, and every item exposes its full Legal Metrology
          and BIS/WPC review state.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/product-safety"
            className="inline-flex h-9 items-center rounded-md border border-pt-border-strong bg-pt-surface px-4 text-xs font-semibold text-pt-ink hover:bg-pt-silver"
          >
            Read Safety & Compliance Policy
          </Link>
          <Link
            href="/guides"
            className="inline-flex h-9 items-center rounded-md border border-pt-border bg-pt-surface px-4 text-xs font-semibold text-pt-cobalt hover:bg-pt-cobalt-soft"
          >
            Explore Technical Buying Guides
          </Link>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold text-pt-ink">
        Complete House Index (#01 - #{catalog.total})
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catalog.items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
}
