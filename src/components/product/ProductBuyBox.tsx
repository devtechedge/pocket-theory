"use client";

import { Heart, Scale, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { PinChecker } from "@/components/product/PinChecker";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { ProductDetailView } from "@/domains/catalog/service";
import { computeSavingsPercent, formatPaise } from "@/lib/money";

export function ProductBuyBox({ product }: { product: ProductDetailView }) {
  const {
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareItems,
    toggleCompare,
    recordRecentlyViewed,
  } = useStorefront();

  const [selectedVariantId, setSelectedVariantId] = useState(
    product.defaultVariantId,
  );
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    recordRecentlyViewed(product.slug);
  }, [product.slug, recordRecentlyViewed]);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0]!;

  const pricePaise = activeVariant.effectivePricePaise;
  const mrpPaise = activeVariant.effectiveMrpPaise;
  const savings = computeSavingsPercent(pricePaise, mrpPaise);
  const outOfStock = activeVariant.stock <= 0;
  const lowStock =
    activeVariant.stock > 0 &&
    activeVariant.stock <= activeVariant.lowStockThreshold;
  const wished = wishlistIds.has(product.id);
  const inCompare = compareItems.some((c) => c.slug === product.slug);

  async function handleAddToCart() {
    if (outOfStock || busy) return;
    setBusy(true);
    try {
      await addToCart(activeVariant.id, quantity);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-extrabold text-pt-tangerine">
            #{String(product.catalogIndex).padStart(2, "0")}
          </span>
          <Badge tone="cobalt">{product.categoryName}</Badge>
          {product.complianceStatus === "DEMO_ILLUSTRATIVE" && (
            <Badge tone="amber">Illustrative Demo Spec</Badge>
          )}
        </div>

        <h1 className="mt-2 font-display text-2xl leading-tight font-extrabold text-pt-ink sm:text-3xl">
          {product.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-pt-ink-muted">
          {product.subtitle}
        </p>
        <p className="mt-1.5 font-mono text-xs text-pt-ink-muted">
          SKU: <strong className="text-pt-ink">{activeVariant.sku}</strong> |
          Model: <strong className="text-pt-ink">{product.modelNumber}</strong>{" "}
          | Brand: <strong className="text-pt-ink">{product.brand}</strong>
        </p>
      </div>

      {/* Price & Tax Disclosure */}
      <div className="rounded-lg border border-pt-border-strong bg-pt-surface-elevated p-4">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span
            data-testid="pdp-price"
            className="font-mono text-2xl font-extrabold text-pt-ink sm:text-3xl"
          >
            {formatPaise(pricePaise)}
          </span>
          {mrpPaise > pricePaise && (
            <>
              <span className="font-mono text-sm text-pt-ink-muted line-through">
                MRP {formatPaise(mrpPaise)}
              </span>
              <Badge tone="tangerine">{savings}% below MRP</Badge>
            </>
          )}
        </div>
        <p className="mt-1 font-mono text-xs text-pt-ink-muted">
          Inclusive of all taxes (18% GST - HSN {product.hsnCode}). Free
          standard dispatch on orders ≥ ₹999.
        </p>
      </div>

      {/* Variant Selector */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-pt-ink uppercase">
            Finish / Variant:{" "}
            <span className="text-pt-cobalt">{activeVariant.label}</span>
          </span>
          <span
            data-testid="pdp-stock-status"
            className={`font-mono text-xs font-bold ${
              outOfStock
                ? "text-pt-danger"
                : lowStock
                  ? "text-pt-amber-ink"
                  : "text-pt-lime-ink"
            }`}
          >
            {outOfStock
              ? "Out of stock"
              : lowStock
                ? `Low stock (${activeVariant.stock} left)`
                : `In stock (${activeVariant.stock} units)`}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Choose product finish"
          className="mt-2 flex flex-wrap gap-2"
        >
          {product.variants.map((v) => {
            const selected = v.id === activeVariant.id;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setSelectedVariantId(v.id);
                  setQuantity(1);
                }}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-pt-ink bg-pt-ink text-pt-surface-elevated"
                    : "border-pt-border bg-pt-surface-elevated text-pt-ink hover:border-pt-border-strong"
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/40"
                  style={{ backgroundColor: v.colorHex }}
                />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity & Primary Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          max={Math.max(1, Math.min(10, activeVariant.stock))}
          disabled={outOfStock}
          onChange={setQuantity}
        />

        <Button
          size="lg"
          disabled={outOfStock || busy}
          onClick={handleAddToCart}
          data-testid="pdp-add-to-cart"
          className="min-w-[11rem] flex-1"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>
            {outOfStock
              ? "Currently Unavailable"
              : busy
                ? "Adding..."
                : "Add to Cart"}
          </span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart
            className="h-4 w-4 text-pt-tangerine"
            fill={wished ? "currentColor" : "none"}
          />
          <span className="hidden sm:inline">
            {wished ? "Saved" : "Wishlist"}
          </span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() =>
            toggleCompare({
              slug: product.slug,
              title: product.title,
              sku: product.sku,
              imageUrl: product.primaryImage.url,
              pricePaise,
            })
          }
          aria-pressed={inCompare}
          data-testid="pdp-compare-button"
        >
          <Scale className="h-4 w-4 text-pt-cobalt" />
          <span>{inCompare ? "In Compare" : "Compare"}</span>
        </Button>
      </div>

      {/* Indian 6-Digit PIN Delivery Estimator */}
      <PinChecker shippingClass={product.shippingClass} />

      {/* Warranty & Return Summary */}
      <div className="grid grid-cols-1 gap-2.5 rounded-lg border border-pt-border bg-pt-surface p-3.5 text-xs sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pt-cobalt" />
          <div>
            <p className="font-semibold text-pt-ink">
              {product.warrantyMonths}-Month House Warranty
            </p>
            <p className="text-pt-ink-muted">
              Against manufacturing defects with GST invoice.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pt-tangerine" />
          <div>
            <p className="font-semibold text-pt-ink">
              {product.returnWindowDays}-Day Replacement / Return
            </p>
            <p className="text-pt-ink-muted">
              Unused condition with intact retail carton & accessories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
