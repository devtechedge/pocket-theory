import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { BUYING_GUIDES } from "@/domains/content/guides";

export const metadata: Metadata = {
  title: "Technical Buying Guides",
  description:
    "Sourced technical explainers on power-bank capacity math, USB-C PD & GaN, ANC vs ENC, earbuds fit, dashcams for Indian summer heat, and mini vacuums.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Engineering Notes // Zero Hype
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-pt-ink sm:text-4xl">
          Technical Buying Guides
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-pt-ink-muted">
          Practical explainers written to help Indian buyers read past inflated
          gadget buzzwords - covering voltage conversion math, USB-IF E-Marker
          cables, ANC vs ENC acoustics, and cabin thermal safety.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {BUYING_GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="flex flex-col justify-between rounded-xl border border-pt-border bg-pt-surface-elevated p-6 transition-colors hover:border-pt-tangerine"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone="cobalt">{g.tag}</Badge>
                <span className="font-mono text-xs text-pt-ink-muted">
                  {g.readingMinutes} min read
                </span>
              </div>
              <h2 className="mt-3 font-display text-lg leading-snug font-bold text-pt-ink">
                {g.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-pt-ink-muted">
                {g.summary}
              </p>
            </div>
            <span className="mt-5 font-mono text-xs font-bold text-pt-tangerine">
              Read full guide →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
