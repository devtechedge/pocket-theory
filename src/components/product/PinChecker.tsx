"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ShippingClass } from "@/db/schema";
import type { PinEstimateResult } from "@/domains/shipping/pin-service";

export function PinChecker({
  shippingClass,
}: {
  shippingClass: ShippingClass;
}) {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<PinEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `/api/shipping/pin-check?pin=${encodeURIComponent(
          pin.trim(),
        )}&shippingClass=${encodeURIComponent(shippingClass)}`,
      );
      const data = (await res.json()) as { estimate: PinEstimateResult };
      setResult(data.estimate);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="pdp-pin-checker"
      className="rounded-lg border border-pt-border bg-pt-surface p-3.5"
    >
      <form onSubmit={handleCheck} className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="pdp-pin-input"
          className="flex w-full items-center gap-1.5 font-mono text-xs font-bold text-pt-ink uppercase"
        >
          <MapPin className="h-3.5 w-3.5 text-pt-tangerine" />
          <span>Check Delivery by 6-Digit PIN</span>
        </label>
        <input
          id="pdp-pin-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="e.g. 400013 or 560001"
          data-testid="pdp-pin-input"
          className="h-9 min-w-0 flex-1 rounded-md border border-pt-border-strong bg-pt-surface-elevated px-3 font-mono text-xs text-pt-ink"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={loading}>
          {loading ? "Checking..." : "Check PIN"}
        </Button>
      </form>

      {result && (
        <div
          role="status"
          data-testid="pdp-pin-result"
          className={`mt-2.5 rounded border p-2.5 text-xs ${
            !result.valid || !result.serviceable
              ? "border-pt-danger/30 bg-pt-danger-soft text-pt-danger-ink"
              : "border-pt-border bg-pt-surface-elevated text-pt-ink"
          }`}
        >
          {result.valid && result.serviceable ? (
            <>
              <p className="font-mono font-bold">
                {result.postalRegion} ({result.pinCode}):{" "}
                {result.minBusinessDays}-{result.maxBusinessDays} business days
              </p>
              <p className="mt-1 text-pt-ink-muted">{result.note}</p>
            </>
          ) : (
            <p className="font-medium">{result.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
