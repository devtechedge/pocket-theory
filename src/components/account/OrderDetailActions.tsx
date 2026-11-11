"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Button } from "@/components/ui/Button";

export function OrderDetailActions({
  orderId,
  canCancel,
  canRequestReturn,
  items,
}: {
  orderId: string;
  canCancel: boolean;
  canRequestReturn: boolean;
  items: ReadonlyArray<{ id: string; productTitle: string; variantLabel: string }>;
}) {
  const router = useRouter();
  const { refreshCartCount, showToast } = useStorefront();
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const [reason, setReason] = useState("Defective or damaged on arrival");
  const [details, setDetails] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReorder() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        method: "POST",
      });
      if (res.ok) {
        await refreshCartCount();
        showToast("Order items added to your shopping bag.");
        router.push("/cart");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Customer cancelled from account page" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Unable to cancel order.");
        return;
      }
      showToast("Order cancelled and stock released.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: selectedItemId,
          reason,
          details,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Unable to submit return request.");
        return;
      }
      setShowReturnForm(false);
      setDetails("");
      showToast("Return / replacement request recorded.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={handleReorder}
          data-testid="order-reorder-btn"
        >
          Reorder Items into Cart
        </Button>

        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={handleCancel}
            data-testid="order-cancel-btn"
          >
            Cancel Order
          </Button>
        )}

        {canRequestReturn && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowReturnForm((s) => !s)}
            data-testid="order-open-return-btn"
          >
            {showReturnForm ? "Close Return Form" : "Request Return / Replacement"}
          </Button>
        )}
      </div>

      {showReturnForm && (
        <form
          onSubmit={handleSubmitReturn}
          data-testid="order-return-form"
          className="space-y-3 rounded-lg border border-pt-border-strong bg-pt-surface p-4 text-xs"
        >
          <h3 className="font-display text-sm font-bold text-pt-ink">
            Submit Return / Replacement Request
          </h3>
          <div>
            <label htmlFor="ret-item" className="block font-mono font-bold uppercase">
              Line Item
            </label>
            <select
              id="ret-item"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5 text-xs"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.productTitle} ({i.variantLabel})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ret-reason" className="block font-mono font-bold uppercase">
              Reason
            </label>
            <select
              id="ret-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface-elevated px-2.5 text-xs"
            >
              <option>Defective or damaged on arrival</option>
              <option>Missing accessory in retail carton</option>
              <option>Unused 7-day return (intact packaging)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ret-details" className="block font-mono font-bold uppercase">
              Condition & Serial / Issue Notes
            </label>
            <textarea
              id="ret-details"
              required
              minLength={5}
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe carton state, serial sticker, or symptom..."
              data-testid="return-details-input"
              className="mt-1 w-full rounded border border-pt-border bg-pt-surface-elevated p-2.5 text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Submitting..." : "Submit Return Request"}
          </Button>
        </form>
      )}
    </div>
  );
}
