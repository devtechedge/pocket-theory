"use client";

import { Check, Heart, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Badge } from "@/components/ui/Badge";
import { PackshotImage } from "@/components/ui/PackshotImage";
import type { CatalogCardItem } from "@/domains/catalog/service";
import { computeSavingsPercent, formatPaise } from "@/lib/money";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogCardItem;
  priority?: boolean;
}) {
  const {
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareItems,
    toggleCompare,
  } = useStorefront();
  const [adding, setAdding] = useState(false);

  const wished = wishlistIds.has(product.id);
  const inCompare = compareItems.some((c) => c.slug === product.slug);
  const savings = computeSavingsPercent(product.pricePaise, product.mrpPaise);
  const indexNum = String(product.catalogIndex).padStart(2, "0");
  const outOfStock = product.totalStock <= 0;
  const lowStock = product.totalStock > 0 && product.totalStock <= 5;

  async function handleQuickAdd() {
    if (outOfStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product.defaultVariantId, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article
      data-testid={`product-card-${product.slug}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-pt-border bg-pt-surface-elevated transition-colors hover:border-pt-border-strong"
    >
      {/* Top index & action rail */}
      <div className="flex items-center justify-between gap-2 border-b border-pt-border bg-pt-surface px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-display text-sm font-extrabold tracking-tight text-pt-ink">
            #{indexNum}
          </span>
          <span className="truncate font-mono text-[0.6875rem] text-pt-ink-muted uppercase">
            {product.categoryName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() =>
              toggleCompare({
                slug: product.slug,
                title: product.title,
                sku: product.sku,
                imageUrl: product.primaryImage.url,
                pricePaise: product.pricePaise,
              })
            }
            aria-label={
              inCompare
                ? `Remove ${product.title} from compare`
                : `Compare ${product.title}`
            }
            aria-pressed={inCompare}
            className={`inline-flex h-7 w-7 items-center justify-center rounded border transition-colors ${
              inCompare
                ? "border-pt-tangerine bg-pt-tangerine-soft text-pt-tangerine-ink"
                : "border-pt-border bg-pt-surface-elevated text-pt-ink-muted hover:text-pt-ink"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={
              wished
                ? `Remove ${product.title} from wishlist`
                : `Save ${product.title} to wishlist`
            }
            aria-pressed={wished}
            className={`inline-flex h-7 w-7 items-center justify-center rounded border transition-colors ${
              wished
                ? "border-pt-tangerine bg-pt-tangerine-soft text-pt-tangerine-ink"
                : "border-pt-border bg-pt-surface-elevated text-pt-ink-muted hover:text-pt-ink"
            }`}
          >
            <Heart
              className="h-3.5 w-3.5"
              fill={wished ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      {/* Studio Packshot */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-pt-paper"
      >
        <PackshotImage
          src={product.primaryImage.url}
          alt={product.primaryImage.alt}
          priority={priority}
        />
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          {product.isNewDrop && <Badge tone="tangerine">New Drop</Badge>}
          {lowStock && (
            <Badge tone="amber">Only {product.totalStock} left</Badge>
          )}
          {outOfStock && <Badge tone="danger">Out of Stock</Badge>}
        </div>
      </Link>

      {/* Product Copy & Pricing */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[0.6875rem] text-pt-cobalt">
              {product.sku}
            </span>
            <div className="flex items-center gap-1" aria-label="Finish options">
              {product.variants.slice(0, 4).map((v) => (
                <span
                  key={v.id}
                  title={v.label}
                  className="inline-block h-2.5 w-2.5 rounded-full border border-pt-border-strong"
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </div>
          </div>

          <h3 className="mt-1.5 font-display text-sm leading-snug font-bold text-pt-ink">
            <Link
              href={`/product/${product.slug}`}
              className="hover:text-pt-tangerine hover:underline"
            >
              {product.title}
            </Link>
          </h3>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-pt-ink-muted">
            {product.subtitle}
          </p>
        </div>

        <div className="mt-4 border-t border-pt-border pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-mono text-base font-bold text-pt-ink">
                  {formatPaise(product.pricePaise)}
                </span>
                {product.mrpPaise > product.pricePaise && (
                  <span className="font-mono text-xs text-pt-ink-muted line-through">
                    {formatPaise(product.mrpPaise)}
                  </span>
                )}
              </div>
              <p className="font-mono text-[0.65rem] text-pt-ink-muted">
                Incl. GST {savings > 0 ? `- ${savings}% below MRP` : ""}
              </p>
            </div>

            <button
              type="button"
              disabled={outOfStock || adding}
              onClick={handleQuickAdd}
              data-testid={`add-to-cart-${product.slug}`}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-pt-tangerine px-3 text-xs font-semibold text-pt-on-tangerine transition-colors hover:bg-pt-tangerine-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {adding ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>{outOfStock ? "Sold out" : "Add"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
