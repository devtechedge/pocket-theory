import { ArrowRight, BookOpen, CheckCircle2, FileText, Truck } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/brand/CategoryIcons";
import { ProductCard } from "@/components/catalog/ProductCard";
import { HeroSection } from "@/components/home/HeroSection";
import { Under999Section } from "@/components/home/Under999Section";
import { Badge } from "@/components/ui/Badge";
import {
  listCategoriesWithCounts,
  queryCatalog,
} from "@/domains/catalog/service";

export const dynamic = "force-dynamic";

const GUIDE_PREVIEWS = [
  {
    slug: "power-bank-capacity-explained",
    tag: "POWER MATH",
    title: "Why a 10,000 mAh Power Bank Delivers ~6,300 mAh to Your Phone",
    blurb: "Cell voltage (3.7V) vs USB bus voltage (5V/9V), Wh flight rules, and heat loss.",
  },
  {
    slug: "usb-c-power-delivery-and-gan",
    tag: "CHARGING",
    title: "USB-C PD, PPS, GaN Bricks & When You Actually Need a 240W E-Marked Cable",
    blurb: "Matching 20W, 33W, and 65W chargers to phones and ultrabooks safely.",
  },
  {
    slug: "anc-vs-enc-audio-guide",
    tag: "ACOUSTICS",
    title: "ANC vs ENC Explained: Quieting Your Commute vs Clarifying Your Mic",
    blurb: "Two acronyms Indian audio listings routinely blur together - separated cleanly.",
  },
];

export default async function HomePage() {
  const [
    categories,
    allFeatured,
    newDrops,
    under999,
    chargingEdit,
    audioEdit,
    deskEdit,
  ] = await Promise.all([
    listCategoriesWithCounts(),
    queryCatalog({ sort: "featured", pageSize: 40 }),
    queryCatalog({ collectionSlug: "new-drops", sort: "newest", pageSize: 4 }),
    queryCatalog({ under999: true, sort: "featured", pageSize: 4 }),
    queryCatalog({ categorySlug: "power-charging", sort: "featured", pageSize: 4 }),
    queryCatalog({ categorySlug: "audio", sort: "featured", pageSize: 4 }),
    queryCatalog({ categorySlug: "desk-creator", sort: "featured", pageSize: 4 }),
  ]);

  const spotlight =
    allFeatured.items.find(
      (i) => i.slug === "pocketcell-pro-20k-65w-laptop-power-bank",
    ) ?? allFeatured.items[0];

  return (
    <div>
      {spotlight && (
        <HeroSection
          spotlight={spotlight}
          totalActiveSkus={allFeatured.total}
        />
      )}

      {/* Bestselling / High-Demand Categories */}
      <section
        aria-labelledby="categories-heading"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold tracking-wider text-pt-cobalt uppercase">
              5 Core Hardware Pillars
            </p>
            <h2
              id="categories-heading"
              className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl"
            >
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pt-ink hover:text-pt-tangerine"
          >
            <span>Full 40-SKU Index</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col justify-between rounded-lg border border-pt-border bg-pt-surface-elevated p-4 transition-colors hover:border-pt-tangerine"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-pt-paper text-pt-ink group-hover:bg-pt-tangerine-soft group-hover:text-pt-tangerine-ink">
                    <CategoryIcon slug={cat.slug} />
                  </span>
                  <span className="font-mono text-xs font-bold text-pt-ink-muted">
                    {cat.productCount} SKUs
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-pt-ink">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-pt-ink-muted">
                  {cat.heroTagline}
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-[0.6875rem] font-bold text-pt-cobalt uppercase">
                Browse shelf <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Drops */}
      <section
        aria-labelledby="new-drops-heading"
        className="mx-auto max-w-7xl px-4 pb-12 sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge tone="cobalt">2026 Hardware Bench</Badge>
            <h2
              id="new-drops-heading"
              className="mt-2 font-display text-2xl font-bold text-pt-ink sm:text-3xl"
            >
              New Drops
            </h2>
          </div>
          <Link
            href="/shop?sort=newest"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pt-cobalt uppercase hover:underline"
          >
            <span>See all new drops</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newDrops.items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      {/* Under INR 999 Discovery */}
      <Under999Section items={under999.items} />

      {/* Curated Category Edits: Charging, Audio, Desk */}
      <section
        aria-label="Curated hardware edits"
        className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6"
      >
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold text-pt-tangerine uppercase">
                Edit 01 // GaN, PD & Lithium Reserve
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-pt-ink">
                Power & Charging Edit
              </h2>
            </div>
            <Link
              href="/category/power-charging"
              className="font-mono text-xs font-bold text-pt-cobalt uppercase hover:underline"
            >
              All 12 Charging SKUs →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {chargingEdit.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold text-pt-tangerine uppercase">
                Edit 02 // Commute, Calls & Desk Listening
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-pt-ink">
                Audio Edit
              </h2>
            </div>
            <Link
              href="/category/audio"
              className="font-mono text-xs font-bold text-pt-cobalt uppercase hover:underline"
            >
              All 9 Audio SKUs →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audioEdit.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold text-pt-tangerine uppercase">
                Edit 03 // Hubs, Mechanical Keys & Studio Tools
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-pt-ink">
                Desk & Creator Edit
              </h2>
            </div>
            <Link
              href="/category/desk-creator"
              className="font-mono text-xs font-bold text-pt-cobalt uppercase hover:underline"
            >
              All 11 Desk SKUs →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deskEdit.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust, Delivery & Compliance Transparency Strip */}
      <section
        aria-labelledby="trust-heading"
        className="border-y border-pt-border bg-pt-surface-elevated py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            id="trust-heading"
            className="font-display text-xl font-bold text-pt-ink sm:text-2xl"
          >
            Built for Indian Buyers Who Read the Spec Label
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-pt-border bg-pt-surface p-5">
              <Truck className="h-5 w-5 text-pt-tangerine" />
              <h3 className="mt-3 font-display text-base font-bold text-pt-ink">
                Free Standard Shipping ≥ ₹999
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-pt-ink-muted">
                Transparent ₹79 standard dispatch below ₹999, live 6-digit PIN
                transit estimates on every product page, and ground-routing
                notes for high-Wh lithium packs.
              </p>
            </div>
            <div className="rounded-lg border border-pt-border bg-pt-surface p-5">
              <FileText className="h-5 w-5 text-pt-cobalt" />
              <h3 className="mt-3 font-display text-base font-bold text-pt-ink">
                Legal Metrology & GST Breakup
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-pt-ink-muted">
                Every SKU prints generic commodity name, net quantity, MRP
                inclusive of all taxes, HSN code, and intra-state CGST/SGST vs
                inter-state IGST invoice split.
              </p>
            </div>
            <div className="rounded-lg border border-pt-border bg-pt-surface p-5">
              <CheckCircle2 className="h-5 w-5 text-pt-tangerine" />
              <h3 className="mt-3 font-display text-base font-bold text-pt-ink">
                Zero Invented Certifications
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-pt-ink-muted">
                BIS CRS and WPC ETA applicability are mapped per SKU without
                fabricating registration numbers; unverified lab specs are
                explicitly labelled pending verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sourced Technical Buying Guides */}
      <section
        aria-labelledby="guides-heading"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
              Engineering Explainers
            </p>
            <h2
              id="guides-heading"
              className="mt-1 font-display text-2xl font-bold text-pt-ink"
            >
              Read Before You Buy
            </h2>
          </div>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pt-cobalt uppercase hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>All 6 Buying Guides</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {GUIDE_PREVIEWS.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="flex flex-col justify-between rounded-lg border border-pt-border bg-pt-surface-elevated p-5 transition-colors hover:border-pt-cobalt"
            >
              <div>
                <Badge tone="cobalt">{g.tag}</Badge>
                <h3 className="mt-3 font-display text-base leading-snug font-bold text-pt-ink">
                  {g.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-pt-ink-muted">
                  {g.blurb}
                </p>
              </div>
              <span className="mt-4 font-mono text-xs font-bold text-pt-tangerine">
                Read explainer →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
