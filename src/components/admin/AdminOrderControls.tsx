"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { OrderStatus } from "@/db/schema";

export function AdminOrderControls({
  order,
  returns,
}: {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    carrierName: string | null;
    trackingNumber: string | null;
  };
  returns: ReadonlyArray<{
    id: string;
    reason: string;
    details: string;
    status: string;
    resolutionNote: string | null;
  }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [carrierName, setCarrierName] = useState(
    order.carrierName ?? "Manual Surface Courier (No Live API)",
  );
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber ?? "",
  );
  const [busy, setBusy] = useState(false);

  async function saveFulfilment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          carrierName,
          trackingNumber,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function updateReturn(
    returnId: string,
    nextStatus: "APPROVED" | "REJECTED" | "REFUNDED",
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/returns/${returnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          resolutionNote: `Marked ${nextStatus} by operations console.`,
          restockUnit: nextStatus === "REFUNDED",
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={saveFulfilment}
        data-testid="admin-order-fulfilment-form"
        className="space-y-4 rounded-xl border border-pt-border-strong bg-pt-surface p-5 text-xs"
      >
        <h2 className="font-display text-base font-bold text-pt-ink">
          Fulfilment, Manual Carrier Tracking & Refund State
        </h2>
        <p className="text-pt-ink-muted">
          Honesty note: Carrier name and AWB tracking fields are manual operator
          records; no live courier webhook integration is claimed without
          carrier credentials.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="adm-ord-status"
              className="block font-mono font-bold uppercase"
            >
              Order Status
            </label>
            <select
              id="adm-ord-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              data-testid="admin-order-status-select"
              className="mt-1 h-9 w-full rounded border border-pt-border-strong bg-pt-surface-elevated px-2 font-mono"
            >
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              <option value="DEMO_CONFIRMED">DEMO_CONFIRMED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PACKED">PACKED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED (Restores Stock)</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="adm-ord-carrier"
              className="block font-mono font-bold uppercase"
            >
              Carrier Name (Manual)
            </label>
            <input
              id="adm-ord-carrier"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5"
            />
          </div>

          <div>
            <label
              htmlFor="adm-ord-trk"
              className="block font-mono font-bold uppercase"
            >
              Tracking / AWB Code
            </label>
            <input
              id="adm-ord-trk"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="PTAWB2026IN"
              data-testid="admin-order-tracking-input"
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5 font-mono"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={busy}
          data-testid="admin-order-save-btn"
        >
          {busy ? "Updating..." : "Update Fulfilment & Log Audit"}
        </Button>
      </form>

      {returns.length > 0 && (
        <div className="space-y-3 rounded-xl border border-pt-border bg-pt-surface p-5 text-xs">
          <h2 className="font-display text-base font-bold text-pt-ink">
            RMA Return & Refund Queue on {order.orderNumber}
          </h2>
          {returns.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-pt-border bg-pt-surface-elevated p-3"
            >
              <div>
                <div className="font-bold text-pt-ink">
                  {r.reason} [{r.status}]
                </div>
                <p className="text-pt-ink-muted">{r.details}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void updateReturn(r.id, "APPROVED")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void updateReturn(r.id, "REFUNDED")}
                >
                  Refund & Restock
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => void updateReturn(r.id, "REJECTED")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
