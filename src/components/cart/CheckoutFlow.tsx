"use client";

import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ShippingMethod } from "@/db/schema";
import type { HydratedCartView } from "@/domains/cart/service";
import { calculateCartPricing } from "@/domains/pricing/calculator";
import { INDIAN_STATES_AND_UTS } from "@/domains/shipping/pin-service";
import { formatPaise } from "@/lib/money";

interface SavedAddressOption {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  stateCode: string;
  pinCode: string;
  isDefault: boolean;
}

export function CheckoutFlow({
  initialCart,
  initialUser,
  savedAddresses,
  paymentCapabilities,
}: {
  initialCart: HydratedCartView;
  initialUser: { email: string; fullName: string; phone: string | null } | null;
  savedAddresses: SavedAddressOption[];
  paymentCapabilities: {
    razorpayConfigured: boolean;
    stripeConfigured: boolean;
    demoSandboxFallback: boolean;
  };
}) {
  const router = useRouter();
  const { refreshCartCount } = useStorefront();

  const defaultAddr =
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idempotencyKey] = useState(
    () => `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const [customerName, setCustomerName] = useState(
    defaultAddr?.recipientName ?? initialUser?.fullName ?? "",
  );
  const [customerEmail, setCustomerEmail] = useState(initialUser?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(
    defaultAddr?.phone ?? initialUser?.phone ?? "",
  );
  const [buyerGstin, setBuyerGstin] = useState("");
  const [line1, setLine1] = useState(defaultAddr?.line1 ?? "");
  const [line2, setLine2] = useState(defaultAddr?.line2 ?? "");
  const [landmark, setLandmark] = useState(defaultAddr?.landmark ?? "");
  const [city, setCity] = useState(defaultAddr?.city ?? "");
  const [stateCode, setStateCode] = useState(defaultAddr?.stateCode ?? "27");
  const [pinCode, setPinCode] = useState(defaultAddr?.pinCode ?? "");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("STANDARD");

  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    orderNumber: string;
    grandTotalPaise: number;
    isDemoOrder: boolean;
    paymentProvider: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const livePricing = useMemo(() => {
    const baseLines = initialCart.items.map((i) => ({
      variantId: i.variantId,
      unitPricePaise: i.unitPricePaise,
      quantity: i.quantity,
      gstRateBps: i.gstRateBps,
    }));
    // Preserve server discount amount proportionally via synthetic fixed coupon
    const syntheticCoupon =
      initialCart.pricing.appliedCouponCode &&
      initialCart.pricing.discountPaise > 0
        ? {
            code: initialCart.pricing.appliedCouponCode,
            discountType: "FIXED_PAISE" as const,
            discountValue: initialCart.pricing.discountPaise,
            minSubtotalPaise: 0,
            maxDiscountPaise: initialCart.pricing.discountPaise,
            usageLimit: null,
            usedCount: 0,
            isActive: true,
            expiresAt: null,
          }
        : null;

    return calculateCartPricing({
      lines: baseLines,
      coupon: syntheticCoupon,
      shippingMethod,
      destinationStateCode: stateCode,
    });
  }, [initialCart, shippingMethod, stateCode]);

  function applySavedAddress(addr: SavedAddressOption) {
    setCustomerName(addr.recipientName);
    setCustomerPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 ?? "");
    setLandmark(addr.landmark ?? "");
    setCity(addr.city);
    setStateCode(addr.stateCode);
    setPinCode(addr.pinCode);
  }

  function advanceToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      setError("Enter a valid 6-digit Indian PIN code.");
      return;
    }
    setStep(2);
  }

  async function createOrderAndOpenPayment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customerName,
          customerEmail,
          customerPhone,
          buyerGstin,
          shippingMethod,
          address: {
            line1,
            line2,
            landmark,
            city,
            stateCode,
            pinCode,
          },
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        order?: {
          id: string;
          orderNumber: string;
          grandTotalPaise: number;
          isDemoOrder: boolean;
          paymentProvider: string;
        };
      };
      if (!res.ok || !data.order) {
        setError(data.error ?? "Unable to reserve inventory for checkout.");
        return;
      }
      setPendingOrder(data.order);
      await refreshCartCount(0);
      setStep(3);
    } finally {
      setBusy(false);
    }
  }

  async function finishDemoPayment(outcome: "AUTHORIZE_DEMO" | "FAIL_DEMO") {
    if (!pendingOrder) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/demo-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: pendingOrder.id,
          outcome,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        order?: { orderNumber: string; status: string };
      };
      if (!res.ok || !data.order) {
        setError(data.error ?? "Demo payment step failed.");
        return;
      }
      router.push(`/order-confirmation/${data.order.orderNumber}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="min-w-0 space-y-6 lg:col-span-7">
        {/* Stepper Indicator */}
        <ol
          aria-label="Checkout steps"
          className="grid grid-cols-3 gap-2 rounded-lg border border-pt-border bg-pt-surface-elevated p-3 font-mono text-xs"
        >
          <li
            className={`rounded px-2.5 py-1.5 font-bold ${
              step === 1
                ? "bg-pt-ink text-pt-surface-elevated"
                : "text-pt-ink-muted"
            }`}
          >
            01. Address & PIN
          </li>
          <li
            className={`rounded px-2.5 py-1.5 font-bold ${
              step === 2
                ? "bg-pt-ink text-pt-surface-elevated"
                : "text-pt-ink-muted"
            }`}
          >
            02. Shipping & GST
          </li>
          <li
            className={`rounded px-2.5 py-1.5 font-bold ${
              step === 3
                ? "bg-pt-ink text-pt-surface-elevated"
                : "text-pt-ink-muted"
            }`}
          >
            03. Payment
          </li>
        </ol>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-pt-danger/35 bg-pt-danger-soft p-3.5 text-xs font-medium text-pt-danger-ink"
          >
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <form
            onSubmit={advanceToStep2}
            data-testid="checkout-step-1"
            className="space-y-4 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-pt-ink">
                1. Contact & Indian Delivery Address
              </h2>
              <Badge tone="cobalt">
                {initialUser ? "Signed-In Account" : "Guest Checkout"}
              </Badge>
            </div>

            {savedAddresses.length > 0 && (
              <div className="rounded-md border border-pt-border bg-pt-surface p-3">
                <p className="font-mono text-[0.6875rem] font-bold text-pt-ink-muted uppercase">
                  Saved Addresses
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => applySavedAddress(a)}
                      className="rounded border border-pt-border-strong bg-pt-surface-elevated px-3 py-1.5 text-left text-xs text-pt-ink hover:border-pt-tangerine"
                    >
                      <strong>{a.label}:</strong> {a.city} - {a.pinCode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="chk-name"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  Recipient Full Name
                </label>
                <input
                  id="chk-name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  data-testid="checkout-name"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="chk-phone"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  10-Digit Indian Mobile
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="9820012345"
                  data-testid="checkout-phone"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 font-mono text-sm text-pt-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="chk-email"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  Email for Invoice & Updates
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  data-testid="checkout-email"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="chk-gstin"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  Buyer GSTIN (Optional)
                </label>
                <input
                  id="chk-gstin"
                  type="text"
                  maxLength={15}
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                  placeholder="27AAAAA0000A1Z5"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border bg-pt-surface px-3 font-mono text-xs uppercase text-pt-ink"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="chk-line1"
                className="block font-mono text-xs font-bold text-pt-ink uppercase"
              >
                Flat / House No., Building, Street
              </label>
              <input
                id="chk-line1"
                required
                minLength={4}
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                data-testid="checkout-line1"
                className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="chk-line2"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  Area / Locality (Optional)
                </label>
                <input
                  id="chk-line2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-pt-border bg-pt-surface px-3 text-sm text-pt-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="chk-landmark"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  Landmark (Optional)
                </label>
                <input
                  id="chk-landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-pt-border bg-pt-surface px-3 text-sm text-pt-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="chk-city"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  City / Town
                </label>
                <input
                  id="chk-city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  data-testid="checkout-city"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="chk-state"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  State / UT
                </label>
                <select
                  id="chk-state"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  data-testid="checkout-state"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-2 text-xs font-medium text-pt-ink"
                >
                  {INDIAN_STATES_AND_UTS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="chk-pin"
                  className="block font-mono text-xs font-bold text-pt-ink uppercase"
                >
                  6-Digit PIN Code
                </label>
                <input
                  id="chk-pin"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="400013"
                  data-testid="checkout-pin"
                  className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 font-mono text-sm text-pt-ink"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                data-testid="checkout-continue-step-2"
                className="w-full sm:w-auto"
              >
                Continue to Shipping & GST Review
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div
            data-testid="checkout-step-2"
            className="space-y-5 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6"
          >
            <h2 className="font-display text-lg font-bold text-pt-ink">
              2. Dispatch Method & Tax Invoice Breakup
            </h2>

            <div className="space-y-2.5">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                  shippingMethod === "STANDARD"
                    ? "border-pt-tangerine bg-pt-tangerine-soft/40"
                    : "border-pt-border bg-pt-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === "STANDARD"}
                    onChange={() => setShippingMethod("STANDARD")}
                    className="accent-pt-tangerine"
                  />
                  <div>
                    <div className="text-sm font-bold text-pt-ink">
                      Standard Insured Dispatch (2-5 business days)
                    </div>
                    <div className="text-xs text-pt-ink-muted">
                      Free on orders ≥ ₹999 (₹79 below ₹999).
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-pt-ink">
                  {livePricing.discountedSubtotalPaise >= 99900
                    ? "FREE"
                    : "₹79"}
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                  shippingMethod === "EXPRESS"
                    ? "border-pt-tangerine bg-pt-tangerine-soft/40"
                    : "border-pt-border bg-pt-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === "EXPRESS"}
                    onChange={() => setShippingMethod("EXPRESS")}
                    className="accent-pt-tangerine"
                  />
                  <div>
                    <div className="text-sm font-bold text-pt-ink">
                      Priority Metro & Tier-1 Dispatch (1-3 business days)
                    </div>
                    <div className="text-xs text-pt-ink-muted">
                      Free on orders ≥ ₹4,999 (₹149 below ₹4,999).
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-pt-ink">
                  {livePricing.discountedSubtotalPaise >= 499900
                    ? "FREE"
                    : "₹149"}
                </span>
              </label>
            </div>

            <div className="rounded-lg border border-pt-border bg-pt-surface p-4 text-xs">
              <p className="font-mono font-bold text-pt-ink uppercase">
                Place of Supply GST Calculation (Origin: Maharashtra - 27)
              </p>
              <p className="mt-1 text-pt-ink-muted">
                {livePricing.gst.supplyType === "INTRA_STATE"
                  ? `Intra-state supply within Maharashtra (27): Taxable Value ${formatPaise(
                      livePricing.gst.taxableValuePaise,
                    )} + 9% CGST (${formatPaise(
                      livePricing.gst.cgstPaise,
                    )}) + 9% SGST (${formatPaise(livePricing.gst.sgstPaise)}).`
                  : `Inter-state supply to State Code ${stateCode}: Taxable Value ${formatPaise(
                      livePricing.gst.taxableValuePaise,
                    )} + 18% IGST (${formatPaise(livePricing.gst.igstPaise)}).`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                ← Edit Address
              </Button>
              <Button
                size="lg"
                disabled={busy}
                onClick={createOrderAndOpenPayment}
                data-testid="checkout-reserve-and-pay"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {busy ? "Reserving Stock..." : "Lock Stock & Proceed to Payment"}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && pendingOrder && (
          <div
            data-testid="checkout-step-3"
            className="space-y-5 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
                  Order Reserved // {pendingOrder.orderNumber}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-pt-ink">
                  3. Complete Payment ({formatPaise(pendingOrder.grandTotalPaise)})
                </h2>
              </div>
              {paymentCapabilities.demoSandboxFallback && (
                <Badge tone="amber">NON-CHARGING DEMO SANDBOX</Badge>
              )}
            </div>

            {pendingOrder.isDemoOrder ? (
              <div className="space-y-4 rounded-lg border-2 border-pt-amber-ink/35 bg-pt-amber-soft p-4">
                <div className="flex items-start gap-2.5 text-xs text-pt-amber-ink">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-bold uppercase">
                      Non-Charging Demo Payment Flow Active
                    </p>
                    <p className="mt-1 leading-relaxed">
                      Live Razorpay / Stripe gateway credentials are not set in
                      this environment. No card, UPI handle, or bank account is
                      collected or charged. Orders completed here are explicitly
                      recorded as{" "}
                      <code className="font-mono font-bold">DEMO_CONFIRMED</code>{" "}
                      (never live <code className="font-mono font-bold">PAID</code>).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    disabled={busy}
                    onClick={() => void finishDemoPayment("AUTHORIZE_DEMO")}
                    data-testid="demo-payment-authorize"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {busy
                        ? "Confirming..."
                        : "Authorize Non-Charging Demo Order"}
                    </span>
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    disabled={busy}
                    onClick={() => void finishDemoPayment("FAIL_DEMO")}
                    data-testid="demo-payment-fail"
                  >
                    Simulate Payment Failure (Release Stock)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-pt-border bg-pt-surface p-4 text-xs text-pt-ink">
                <p className="font-semibold">
                  Live Gateway Initialized ({pendingOrder.paymentProvider})
                </p>
                <p className="mt-1 text-pt-ink-muted">
                  Complete payment through your configured gateway checkout
                  widget; server-side HMAC signature verification confirms
                  settlement.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Server-Aligned Order Summary */}
      <aside className="min-w-0 lg:col-span-5">
        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-5">
          <h2 className="font-display text-base font-bold text-pt-ink">
            Items in Your Order ({livePricing.itemCount})
          </h2>

          <ul className="mt-4 divide-y divide-pt-border text-xs">
            {initialCart.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-pt-ink">
                    {item.title}
                  </div>
                  <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
                    {item.variantLabel} x {item.quantity}
                  </div>
                </div>
                <span className="shrink-0 font-mono font-bold text-pt-ink">
                  {formatPaise(item.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-pt-border pt-4 text-xs">
            <div className="flex justify-between">
              <dt className="text-pt-ink-muted">Subtotal</dt>
              <dd className="font-mono font-semibold text-pt-ink">
                {formatPaise(livePricing.subtotalPaise)}
              </dd>
            </div>
            {livePricing.discountPaise > 0 && (
              <div className="flex justify-between text-pt-lime-ink">
                <dt>Discount ({livePricing.appliedCouponCode})</dt>
                <dd className="font-mono font-semibold">
                  -{formatPaise(livePricing.discountPaise)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-pt-ink-muted">
                Shipping ({shippingMethod})
              </dt>
              <dd className="font-mono font-semibold text-pt-ink">
                {livePricing.shippingPaise === 0
                  ? "FREE"
                  : formatPaise(livePricing.shippingPaise)}
              </dd>
            </div>
            <div className="flex justify-between text-pt-ink-muted">
              <dt>Taxable Value (Excl. GST)</dt>
              <dd className="font-mono">
                {formatPaise(livePricing.gst.taxableValuePaise)}
              </dd>
            </div>
            {livePricing.gst.supplyType === "INTRA_STATE" ? (
              <>
                <div className="flex justify-between text-pt-ink-muted">
                  <dt>CGST (9%)</dt>
                  <dd className="font-mono">
                    {formatPaise(livePricing.gst.cgstPaise)}
                  </dd>
                </div>
                <div className="flex justify-between text-pt-ink-muted">
                  <dt>SGST (9%)</dt>
                  <dd className="font-mono">
                    {formatPaise(livePricing.gst.sgstPaise)}
                  </dd>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-pt-ink-muted">
                <dt>IGST (18%)</dt>
                <dd className="font-mono">
                  {formatPaise(livePricing.gst.igstPaise)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-pt-border pt-3 text-base font-bold text-pt-ink">
              <dt>Total Payable (INR)</dt>
              <dd
                data-testid="checkout-total-payable"
                className="font-mono text-lg"
              >
                {formatPaise(livePricing.grandTotalPaise)}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
