import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import type { CatalogCardItem } from "@/domains/catalog/service";

export function Under999Section({ items }: { items: CatalogCardItem[] }) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="under-999-heading"
      className="border-y border-pt-border bg-pt-paper py-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="tangerine">Everyday Essentials // Free Shipping Threshold</Badge>
            <h2
              id="under-999-heading"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-pt-ink sm:text-3xl"
            >
              Under ₹999 Discovery
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-pt-ink-muted">
              High-utility cables, 20W PD cubes, USB-C DAC earphones, silent
              wireless mice, and car accessories that upgrade daily carry
              without padding your cart.
            </p>
          </div>
          <Link
            href="/shop?under999=1"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pt-cobalt uppercase hover:underline"
          >
            <span>View all under ₹999</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
