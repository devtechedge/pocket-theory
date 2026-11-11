"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPaise } from "@/lib/money";

interface CouponRow {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_PAISE";
  discountValue: number;
  minSubtotalPaise: number;
  maxDiscountPaise: number | null;
  usedCount: number;
  usageLimit: number | null;
  isActive: boolean;
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<
    "PERCENTAGE" | "FIXED_PAISE"
  >("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [minSubtotalPaise, setMinSubtotalPaise] = useState("99900");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description,
          discountType,
          discountValue: Number(discountValue),
          minSubtotalPaise: Number(minSubtotalPaise),
          maxDiscountPaise: discountType === "PERCENTAGE" ? 50000 : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create coupon.");
        return;
      }
      setCode("");
      setDescription("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-7">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pt-border bg-pt-surface-elevated p-4 text-xs"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-pt-ink">
                  {c.code}
                </span>
                <Badge tone={c.isActive ? "lime" : "neutral"}>
                  {c.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>
              <p className="mt-1 text-pt-ink-muted">{c.description}</p>
              <p className="mt-1 font-mono text-[0.6875rem] text-pt-ink-muted">
                Min subtotal: {formatPaise(c.minSubtotalPaise)} | Used:{" "}
                {c.usedCount}/{c.usageLimit ?? "∞"}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void toggleActive(c.id, !c.isActive)}
            >
              {c.isActive ? "Disable" : "Enable"}
            </Button>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-5 text-xs lg:col-span-5"
      >
        <h2 className="font-display text-base font-bold text-pt-ink">
          Mint New Coupon
        </h2>
        <div>
          <label htmlFor="cpn-code" className="block font-mono font-bold uppercase">
            Code
          </label>
          <input
            id="cpn-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MONSOON10"
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono uppercase"
          />
        </div>
        <div>
          <label htmlFor="cpn-desc" className="block font-mono font-bold uppercase">
            Description
          </label>
          <input
            id="cpn-desc"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="10% off charging accessories above ₹999"
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cpn-type" className="block font-mono font-bold uppercase">
              Type
            </label>
            <select
              id="cpn-type"
              value={discountType}
              onChange={(e) =>
                setDiscountType(
                  e.target.value as "PERCENTAGE" | "FIXED_PAISE",
                )
              }
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_PAISE">Fixed (Paise)</option>
            </select>
          </div>
          <div>
            <label htmlFor="cpn-val" className="block font-mono font-bold uppercase">
              Value
            </label>
            <input
              id="cpn-val"
              type="number"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono"
            />
          </div>
        </div>
        <div>
          <label htmlFor="cpn-min" className="block font-mono font-bold uppercase">
            Min Subtotal (Paise)
          </label>
          <input
            id="cpn-min"
            type="number"
            required
            value={minSubtotalPaise}
            onChange={(e) => setMinSubtotalPaise(e.target.value)}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono"
          />
        </div>
        {error && <p className="text-pt-danger">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving..." : "Create Coupon"}
        </Button>
      </form>
    </div>
  );
}
