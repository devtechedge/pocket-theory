"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import type { CatalogCardItem } from "@/domains/catalog/service";

export function RecentlyViewedRow({ excludeSlug }: { excludeSlug: string }) {
  const { recentlyViewedSlugs } = useStorefront();
  const [items, setItems] = useState<CatalogCardItem[]>([]);

  useEffect(() => {
    const slugs = recentlyViewedSlugs
      .filter((s) => s !== excludeSlug)
      .slice(0, 4);
    if (slugs.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/catalog/cards?slugs=${encodeURIComponent(slugs.join(","))}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: CatalogCardItem[] }) => setItems(d.items ?? []))
      .catch(() => undefined);

    return () => controller.abort();
  }, [recentlyViewedSlugs, excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-14">
      <h2
        id="recently-viewed-heading"
        className="font-display text-lg font-bold text-pt-ink"
      >
        Recently Viewed on This Device
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
