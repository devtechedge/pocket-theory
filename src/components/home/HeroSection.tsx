import { ArrowRight, Scale, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PackshotImage } from "@/components/ui/PackshotImage";
import type { CatalogCardItem } from "@/domains/catalog/service";
import { formatPaise } from "@/lib/money";

export function HeroSection({
  spotlight,
  totalActiveSkus,
}: {
  spotlight: CatalogCardItem;
  totalActiveSkus: number;
}) {
  return (
    <section
      data-testid="home-hero"
      className="pt-tech-grid border-b border-pt-border-strong bg-pt-surface-elevated"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-14">
        <div className="min-w-0 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="tangerine">2026 Catalogue // 01-{totalActiveSkus}</Badge>
            <Badge tone="cobalt">Single-Brand D2C Hardware</Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl leading-[1.08] font-extrabold tracking-tight text-pt-ink sm:text-5xl">
            Useful tech.{" "}
            <span className="text-pt-tangerine">Zero fuss.</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-pt-ink-muted sm:text-lg">
            Everyday personal electronics for Indian bags, desks, and car
            cabins. Forty original tools across GaN charging, ANC & wired audio,
            wearables, workspace gear, and travel utilities - built around honest
            spec sheets instead of noisy flash-sale timers.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-pt-tangerine px-5 text-sm font-semibold text-pt-on-tangerine transition-colors hover:bg-pt-tangerine-hover"
            >
              <span>Explore All {totalActiveSkus} SKUs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shop?under999=1"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-pt-border-strong bg-pt-surface px-5 text-sm font-semibold text-pt-ink transition-colors hover:bg-pt-silver"
            >
              <span>Under ₹999 Edit</span>
            </Link>
            <Link
              href="/compare?skus=voltcore-65w-dual-port-gan-wall-charger,voltcore-33w-dual-port-fast-charger,minivolt-20w-usb-c-pd-charger"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-pt-border bg-pt-surface px-4 font-mono text-xs font-semibold text-pt-cobalt hover:bg-pt-cobalt-soft"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Compare Chargers</span>
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-pt-border pt-6 sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-1.5 font-mono text-xs font-bold text-pt-ink uppercase">
                <Zap className="h-3.5 w-3.5 text-pt-tangerine" />
                Spec Clarity
              </dt>
              <dd className="mt-1 text-xs text-pt-ink-muted">
                Port splits, Wh notes, and explicit verification status on every
                sheet.
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 font-mono text-xs font-bold text-pt-ink uppercase">
                <ShieldCheck className="h-3.5 w-3.5 text-pt-cobalt" />
                INR + GST Truth
              </dt>
              <dd className="mt-1 text-xs text-pt-ink-muted">
                Integer-paise totals with CGST/SGST vs IGST breakup at checkout.
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="font-mono text-xs font-bold text-pt-ink uppercase">
                PIN Coverage
              </dt>
              <dd className="mt-1 text-xs text-pt-ink-muted">
                6-digit Indian PIN transit estimator with lithium surface-route
                flags.
              </dd>
            </div>
          </dl>
        </div>

        {/* Flagship Spotlight Card */}
        <div className="min-w-0 lg:col-span-5">
          <div className="overflow-hidden rounded-xl border border-pt-border-strong bg-pt-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-pt-border px-4 py-2.5 font-mono text-xs">
              <span className="font-bold text-pt-ink">
                SPOTLIGHT // #{String(spotlight.catalogIndex).padStart(2, "0")}
              </span>
              <span className="text-pt-cobalt">{spotlight.sku}</span>
            </div>
            <Link
              href={`/product/${spotlight.slug}`}
              className="block aspect-[4/3] w-full bg-pt-paper"
            >
              <PackshotImage
                src={spotlight.primaryImage.url}
                alt={spotlight.primaryImage.alt}
                priority
              />
            </Link>
            <div className="p-4">
              <h2 className="font-display text-lg font-bold text-pt-ink">
                <Link
                  href={`/product/${spotlight.slug}`}
                  className="hover:text-pt-tangerine"
                >
                  {spotlight.title}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-pt-ink-muted">
                {spotlight.subtitle}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-pt-border pt-3">
                <div>
                  <span className="font-mono text-lg font-bold text-pt-ink">
                    {formatPaise(spotlight.pricePaise)}
                  </span>
                  <span className="ml-2 font-mono text-xs text-pt-ink-muted line-through">
                    {formatPaise(spotlight.mrpPaise)}
                  </span>
                </div>
                <Link
                  href={`/product/${spotlight.slug}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-pt-ink px-3.5 text-xs font-semibold text-pt-surface-elevated hover:opacity-90"
                >
                  <span>Inspect Spec Sheet</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
