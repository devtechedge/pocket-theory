"use client";

import { ArrowRight, Tag, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PackshotImage } from "@/components/ui/PackshotImage";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { HydratedCartView } from "@/domains/cart/service";
import type { CatalogCardItem } from "@/domains/catalog/service";
import { formatPaise } from "@/lib/money";

export function CartView({
  initialCart,
  crossSells,
}: {
  initialCart: HydratedCartView;
  crossSells: CatalogCardItem[];
}) {
  const router = useRouter();
  const { refreshCartCount, showToast } = useStorefront();
  const [cart, setCart] = useState(initialCart);
  const [couponInput, setCouponInput] = useState(
    initialCart.requestedCouponCode ?? "",
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setVariantQty(variantId: string, quantity: number) {
    setBusyId(variantId);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity, mode: "set" }),
      });
      const data = (await res.json()) as {
        cart?: HydratedCartView;
        error?: string;
      };
      if (!res.ok || !data.cart) {
        showToast(data.error ?? "Unable to update quantity.");
        return;
      }
      setCart(data.cart);
      await refreshCartCount(data.cart.pricing.itemCount);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function applyPromo(code: string | null) {
    setBusyId("coupon");
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as {
        cart?: HydratedCartView;
        error?: string;
      };
      if (!res.ok || !data.cart) {
        showToast(data.error ?? "Promo code could not be applied.");
        return;
      }
      setCart(data.cart);
      setCouponInput(code ?? "");
      showToast(code ? `Promo ${code.toUpperCase()} updated.` : "Promo removed.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="space-y-12">
        <div
          data-testid="empty-cart"
          className="rounded-xl border border-pt-border bg-pt-surface-elevated p-10 text-center"
        >
          <h1 className="font-display text-2xl font-bold text-pt-ink">
            Your shopping bag is empty.
          </h1>
          <p className="mt-2 text-sm text-pt-ink-muted">
            Standard shipping across India is free on orders of ₹999 and above.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-10 items-center rounded-md bg-pt-tangerine px-5 text-sm font-semibold text-pt-on-tangerine"
            >
              Browse All 40 Products
            </Link>
            <Link
              href="/shop?under999=1"
              className="inline-flex h-10 items-center rounded-md border border-pt-border-strong bg-pt-surface px-5 text-sm font-semibold text-pt-ink"
            >
              Under ₹999 Essentials
            </Link>
          </div>
        </div>

        {crossSells.length > 0 && (
          <section aria-labelledby="empty-cart-picks">
            <h2
              id="empty-cart-picks"
              className="font-display text-lg font-bold text-pt-ink"
            >
              Everyday Carry Favourites
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {crossSells.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const { pricing } = cart;
  const freeShipPct = Math.min(
    100,
    Math.round(
      (pricing.discountedSubtotalPaise / pricing.freeStandardThresholdPaise) *
        100,
    ),
  );

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Cart Lines */}
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <div className="rounded-lg border border-pt-border bg-pt-surface-elevated p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-pt-ink">
              <Truck className="h-4 w-4 text-pt-tangerine" />
              {pricing.amountToFreeShippingPaise === 0 ? (
                <span>
                  You unlocked <strong>FREE Standard Shipping</strong> across
                  India.
                </span>
              ) : (
                <span>
                  Add{" "}
                  <strong className="font-mono">
                    {formatPaise(pricing.amountToFreeShippingPaise)}
                  </strong>{" "}
                  more to unlock free standard shipping (₹999 threshold).
                </span>
              )}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-pt-paper">
              <div
                className="h-full bg-pt-tangerine transition-all"
                style={{ width: `${freeShipPct}%` }}
              />
            </div>
          </div>

          <ul
            data-testid="cart-line-list"
            className="divide-y divide-pt-border rounded-xl border border-pt-border bg-pt-surface-elevated"
          >
            {cart.items.map((line) => (
              <li
                key={line.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/product/${line.slug}`}
                  className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md border border-pt-border bg-pt-paper"
                >
                  <PackshotImage src={line.imageUrl} alt={line.title} />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-display text-sm font-bold text-pt-ink hover:text-pt-tangerine"
                  >
                    {line.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-pt-ink-muted">
                    Finish: {line.variantLabel} | SKU: {line.sku}
                  </p>
                  <p className="mt-0.5 text-xs text-pt-ink-muted">
                    {line.warrantyMonths}-month warranty | HSN {line.hsnCode}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                  <QuantityStepper
                    value={line.quantity}
                    max={Math.min(10, line.availableStock)}
                    disabled={busyId === line.variantId}
                    onChange={(next) => void setVariantQty(line.variantId, next)}
                    label={`Quantity for ${line.title}`}
                  />

                  <div className="min-w-[5.5rem] text-right">
                    <div className="font-mono text-sm font-bold text-pt-ink">
                      {formatPaise(line.lineTotalPaise)}
                    </div>
                    <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
                      {formatPaise(line.unitPricePaise)} each
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${line.title} from cart`}
                    disabled={busyId === line.variantId}
                    onClick={() => void setVariantQty(line.variantId, 0)}
                    className="rounded p-1.5 text-pt-ink-muted hover:bg-pt-silver hover:text-pt-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary & Promo Box */}
        <aside className="min-w-0 lg:col-span-4">
          <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-5">
            <h2 className="font-display text-lg font-bold text-pt-ink">
              Order Summary
            </h2>

            {/* Promo code input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void applyPromo(couponInput.trim() || null);
              }}
              className="mt-4"
            >
              <label
                htmlFor="cart-coupon-input"
                className="flex items-center gap-1.5 font-mono text-xs font-bold text-pt-ink uppercase"
              >
                <Tag className="h-3.5 w-3.5 text-pt-cobalt" />
                <span>Promo Code</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="cart-coupon-input"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  data-testid="cart-coupon-input"
                  className="h-9 min-w-0 flex-1 rounded-md border border-pt-border bg-pt-surface px-3 font-mono text-xs uppercase text-pt-ink"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={busyId === "coupon"}
                >
                  Apply
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[0.65rem]">
                <button
                  type="button"
                  onClick={() => void applyPromo("WELCOME10")}
                  className="rounded border border-pt-border px-1.5 py-0.5 text-pt-cobalt hover:bg-pt-cobalt-soft"
                >
                  WELCOME10
                </button>
                <button
                  type="button"
                  onClick={() => void applyPromo("POCKET150")}
                  className="rounded border border-pt-border px-1.5 py-0.5 text-pt-cobalt hover:bg-pt-cobalt-soft"
                >
                  POCKET150
                </button>
                <button
                  type="button"
                  onClick={() => void applyPromo("DESK15")}
                  className="rounded border border-pt-border px-1.5 py-0.5 text-pt-cobalt hover:bg-pt-cobalt-soft"
                >
                  DESK15
                </button>
              </div>
              {pricing.appliedCouponCode && (
                <div className="mt-2 flex items-center justify-between">
                  <Badge tone="lime">
                    {pricing.appliedCouponCode} applied (-
                    {formatPaise(pricing.discountPaise)})
                  </Badge>
                  <button
                    type="button"
                    onClick={() => void applyPromo(null)}
                    className="font-mono text-xs text-pt-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {pricing.couponRejectionReason && (
                <p className="mt-1.5 text-xs text-pt-danger">
                  {pricing.couponRejectionReason}
                </p>
              )}
            </form>

            <dl className="mt-5 space-y-2.5 border-t border-pt-border pt-4 text-xs">
              <div className="flex justify-between">
                <dt className="text-pt-ink-muted">
                  Items Subtotal ({pricing.itemCount})
                </dt>
                <dd className="font-mono font-semibold text-pt-ink">
                  {formatPaise(pricing.subtotalPaise)}
                </dd>
              </div>

              {pricing.discountPaise > 0 && (
                <div className="flex justify-between text-pt-lime-ink">
                  <dt>Promo Discount ({pricing.appliedCouponCode})</dt>
                  <dd className="font-mono font-semibold">
                    -{formatPaise(pricing.discountPaise)}
                  </dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-pt-ink-muted">Standard Shipping</dt>
                <dd className="font-mono font-semibold text-pt-ink">
                  {pricing.shippingPaise === 0
                    ? "FREE"
                    : formatPaise(pricing.shippingPaise)}
                </dd>
              </div>

              <div className="flex justify-between text-pt-ink-muted">
                <dt>Included GST (18% estimate)</dt>
                <dd className="font-mono">
                  {formatPaise(pricing.gst.totalTaxPaise)}
                </dd>
              </div>

              <div className="flex justify-between border-t border-pt-border pt-3 text-base font-bold text-pt-ink">
                <dt>Grand Total</dt>
                <dd
                  data-testid="cart-grand-total"
                  className="font-mono text-lg"
                >
                  {formatPaise(pricing.grandTotalPaise)}
                </dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              data-testid="proceed-to-checkout"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-pt-tangerine px-5 text-sm font-semibold text-pt-on-tangerine transition-colors hover:bg-pt-tangerine-hover"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>

      {crossSells.length > 0 && (
        <section aria-labelledby="cart-cross-sell">
          <h2
            id="cart-cross-sell"
            className="font-display text-lg font-bold text-pt-ink"
          >
            Pair with Cables & Compact Adapters
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {crossSells.map((c) => (
              <ProductCard key={c.id} product={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
