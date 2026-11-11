"use client";

import { useState } from "react";
import { PackshotImage } from "@/components/ui/PackshotImage";
import type { ProductImage } from "@/db/schema";

const VIEW_LABELS: Record<ProductImage["kind"], string> = {
  front: "Studio Front",
  detail: "Ports & Architecture",
  spec: "Footprint & Box",
  gallery: "Gallery View",
};

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = images[activeIndex] ?? images[0];

  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-pt-border-strong bg-pt-paper">
        <div className="aspect-[4/3] w-full">
          <PackshotImage src={current.url} alt={current.alt} priority />
        </div>
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="Product gallery views"
          className="grid grid-cols-3 gap-2.5"
        >
          {images.map((img, idx) => {
            const selected = idx === activeIndex;
            return (
              <button
                key={img.url}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveIndex(idx)}
                className={`overflow-hidden rounded-lg border text-left transition-colors ${
                  selected
                    ? "border-pt-tangerine bg-pt-surface-elevated ring-1 ring-pt-tangerine"
                    : "border-pt-border bg-pt-surface hover:border-pt-border-strong"
                }`}
              >
                <div className="aspect-[4/3] w-full bg-pt-paper">
                  <PackshotImage src={img.url} alt={img.alt} />
                </div>
                <div className="px-2 py-1 font-mono text-[0.65rem] font-bold text-pt-ink truncate">
                  {VIEW_LABELS[img.kind] ?? `View ${idx + 1}`}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
