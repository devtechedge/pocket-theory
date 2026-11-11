"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPaise } from "@/lib/money";

interface GuestOrderView {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  isDemoOrder: boolean;
  createdAt: string;
  shippingCity: string;
  shippingState: string;
  shippingPinCode: string;
  carrierName: string | null;
  trackingNumber: string | null;
  grandTotalPaise: number;
  items: Array<{
    productTitle: string;
    variantLabel: string;
    quantity: number;
    lineTotalPaise: number;
  }>;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contactVerifier, setContactVerifier] = useState("");
  const [result, setResult] = useState<GuestOrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contactVerifier }),
      });
      const data = (await res.json()) as {
        order?: GuestOrderView;
        error?: string;
      };
      if (!res.ok || !data.order) {
        setError(data.error ?? "Order not found.");
        return;
      }
      setResult(data.order);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6">
        <Badge tone="cobalt">Secure Order Lookup</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold text-pt-ink">
          Track Your Order
        </h1>
        <p className="mt-1 text-xs text-pt-ink-muted">
          Enter your order reference (e.g. <code className="font-mono">PT-2026-10001</code>)
          along with the billing email or 10-digit mobile number used at
          checkout, or{" "}
          <Link href="/account/orders" className="font-semibold text-pt-cobalt underline">
            view all orders in your signed-in account
          </Link>
          .
        </p>

        <form onSubmit={handleLookup} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="trk-num"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              Order Number
            </label>
            <input
              id="trk-num"
              required
              placeholder="PT-2026-10001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 font-mono text-sm uppercase text-pt-ink"
            />
          </div>

          <div>
            <label
              htmlFor="trk-contact"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              Order Email or 10-Digit Mobile
            </label>
            <input
              id="trk-contact"
              required
              placeholder="customer@pockettheory.demo or 9820411209"
              value={contactVerifier}
              onChange={(e) => setContactVerifier(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded border border-pt-danger/30 bg-pt-danger-soft p-2.5 text-xs text-pt-danger-ink"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? "Verifying..." : "Look Up Order"}
          </Button>
        </form>
      </div>

      {result && (
        <div
          data-testid="tracked-order-card"
          className="mt-6 rounded-xl border border-pt-border bg-pt-surface-elevated p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-base font-bold text-pt-ink">
              {result.orderNumber}
            </h2>
            <div className="flex gap-1.5">
              <Badge tone="cobalt">{result.status}</Badge>
              <Badge tone={result.isDemoOrder ? "amber" : "lime"}>
                {result.paymentStatus}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-xs text-pt-ink-muted">
            Destination: {result.shippingCity}, {result.shippingState} -{" "}
            {result.shippingPinCode} (Street details redacted on public lookup)
          </p>
          {result.carrierName && (
            <p className="mt-1 font-mono text-xs text-pt-ink">
              Dispatch Ref: {result.carrierName} //{" "}
              {result.trackingNumber ?? "Pending AWB"}
            </p>
          )}

          <ul className="mt-4 divide-y divide-pt-border border-t border-pt-border text-xs">
            {result.items.map((item) => (
              <li
                key={`${item.productTitle}-${item.variantLabel}`}
                className="flex justify-between py-2.5"
              >
                <span>
                  {item.productTitle} ({item.variantLabel}) x {item.quantity}
                </span>
                <span className="font-mono font-bold">
                  {formatPaise(item.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between border-t border-pt-border pt-3 text-sm font-bold">
            <span>Grand Total</span>
            <span className="font-mono">
              {formatPaise(result.grandTotalPaise)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
