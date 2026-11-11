"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function InventoryAdjustRow({
  variant,
}: {
  variant: {
    id: string;
    sku: string;
    label: string;
    stock: number;
    lowStockThreshold: number;
    productTitle: string;
  };
}) {
  const router = useRouter();
  const [delta, setDelta] = useState("10");
  const [reason, setReason] = useState<
    "ADMIN_RESTOCK" | "ADMIN_DAMAGE" | "ADMIN_AUDIT"
  >("ADMIN_RESTOCK");
  const [note, setNote] = useState("Warehouse intake");
  const [busy, setBusy] = useState(false);

  async function applyAdjustment(e: React.FormEvent) {
    e.preventDefault();
    const num = Number.parseInt(delta, 10);
    if (!Number.isFinite(num) || num === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant.id,
          delta: num,
          reason,
          note,
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr data-testid={`inventory-row-${variant.sku}`}>
      <td className="px-4 py-3">
        <div className="font-semibold text-pt-ink">{variant.productTitle}</div>
        <div className="font-mono text-[0.6875rem] text-pt-cobalt">
          {variant.sku} ({variant.label})
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          tone={
            variant.stock === 0
              ? "danger"
              : variant.stock <= variant.lowStockThreshold
                ? "amber"
                : "lime"
          }
        >
          {variant.stock} units
        </Badge>
      </td>
      <td className="px-4 py-3">
        <form
          onSubmit={applyAdjustment}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="number"
            aria-label={`Delta for ${variant.sku}`}
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            data-testid={`inv-delta-${variant.sku}`}
            className="h-8 w-20 rounded border border-pt-border bg-pt-surface px-2 font-mono text-xs"
          />
          <select
            aria-label={`Reason for ${variant.sku}`}
            value={reason}
            onChange={(e) =>
              setReason(
                e.target.value as
                  | "ADMIN_RESTOCK"
                  | "ADMIN_DAMAGE"
                  | "ADMIN_AUDIT",
              )
            }
            className="h-8 rounded border border-pt-border bg-pt-surface px-2 text-xs"
          >
            <option value="ADMIN_RESTOCK">Restock (+)</option>
            <option value="ADMIN_DAMAGE">Damage (-)</option>
            <option value="ADMIN_AUDIT">Cycle Audit</option>
          </select>
          <input
            aria-label={`Note for ${variant.sku}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-8 w-36 rounded border border-pt-border bg-pt-surface px-2 text-xs"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={busy}
            data-testid={`inv-apply-${variant.sku}`}
          >
            {busy ? "..." : "Record"}
          </Button>
        </form>
      </td>
    </tr>
  );
}
