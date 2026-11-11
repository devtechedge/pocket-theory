import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductSpecsPanel } from "@/components/product/ProductSpecsPanel";
import { RecentlyViewedRow } from "@/components/product/RecentlyViewedRow";
import { StatutoryDisclosure } from "@/components/product/StatutoryDisclosure";
import { getProductBySlug } from "@/domains/catalog/service";
import { getSiteUrl } from "@/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  return {
    title: product.title,
    description: product.subtitle,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.title} | POCKET THEORY`,
      description: product.subtitle,
      images: [{ url: product.primaryImage.url, alt: product.primaryImage.alt }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const siteUrl = getSiteUrl();
  // Verified-fields-only Product JSON-LD (zero fabricated ratings or reviews)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    mpn: product.modelNumber,
    description: product.subtitle,
    image: product.images.map((i) => `${siteUrl}${i.url}`),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "INR",
      price: (product.pricePaise / 100).toFixed(2),
      availability:
        product.totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-5 font-mono text-xs text-pt-ink-muted"
      >
        <Link href="/" className="hover:text-pt-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/shop" className="hover:text-pt-ink">
          Shop
        </Link>{" "}
        /{" "}
        <Link
          href={`/category/${product.categorySlug}`}
          className="hover:text-pt-ink"
        >
          {product.categoryName}
        </Link>{" "}
        / <span className="text-pt-ink">{product.title}</span>
      </nav>

      {/* Primary Gallery + BuyBox */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <ProductGallery images={product.images} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <ProductBuyBox product={product} />
        </div>
      </div>

      {/* Specs, Compatibility & Box Contents */}
      <div className="mt-12 border-t border-pt-border pt-10">
        <ProductSpecsPanel product={product} />
      </div>

      {/* Statutory Legal Metrology & Safety Disclosure */}
      <div className="mt-12">
        <StatutoryDisclosure product={product} />
      </div>

      {/* Product FAQs */}
      {product.faqs.length > 0 && (
        <section aria-labelledby="pdp-faq-heading" className="mt-12">
          <h2
            id="pdp-faq-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            Product Questions & Answers
          </h2>
          <div className="mt-4 space-y-3">
            {product.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-pt-border bg-pt-surface-elevated p-4"
              >
                <summary className="cursor-pointer font-sans text-sm font-bold text-pt-ink">
                  {faq.question}
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-pt-ink-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Rule-Based Accessory Cross-Sells */}
      {product.accessories.length > 0 && (
        <section aria-labelledby="accessories-heading" className="mt-14">
          <h2
            id="accessories-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            Compatible Cables, Chargers & Companion Gear
          </h2>
          <p className="mt-1 text-xs text-pt-ink-muted">
            Matched by connector wattage and daily setup compatibility.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {product.accessories.map((acc) => (
              <ProductCard key={acc.id} product={acc} />
            ))}
          </div>
        </section>
      )}

      {/* Related in Category */}
      {product.related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2
            id="related-heading"
            className="font-display text-lg font-bold text-pt-ink"
          >
            More in {product.categoryName}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {product.related.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedRow excludeSlug={product.slug} />
    </div>
  );
}
