import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { getCardsBySlugs } from "@/domains/catalog/service";
import { getGuideBySlug } from "@/domains/content/guides";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide" };
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedProducts = await getCardsBySlugs([...guide.relatedSlugs]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/guides"
        className="font-mono text-xs font-bold text-pt-cobalt hover:underline"
      >
        ← All Buying Guides
      </Link>

      <article className="mt-4 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="tangerine">{guide.tag}</Badge>
          <span className="font-mono text-xs text-pt-ink-muted">
            {guide.readingMinutes} min read | Reviewed {guide.updatedDate}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl leading-tight font-extrabold text-pt-ink sm:text-3xl">
          {guide.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-pt-ink-muted">
          {guide.summary}
        </p>

        <div className="mt-8 space-y-6 border-t border-pt-border pt-6">
          {guide.sections.map((sec) => (
            <section key={sec.heading}>
              <h2 className="font-display text-lg font-bold text-pt-ink">
                {sec.heading}
              </h2>
              {sec.paragraphs.map((p) => (
                <p
                  key={p}
                  className="mt-2.5 text-sm leading-relaxed text-pt-ink-muted"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-pt-border bg-pt-surface p-4 text-xs">
          <p className="font-mono font-bold text-pt-ink uppercase">
            Primary Standards & Industry References
          </p>
          <ul className="mt-2 space-y-1">
            {guide.sources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pt-cobalt hover:underline"
                >
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            Related Hardware in Catalogue
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
