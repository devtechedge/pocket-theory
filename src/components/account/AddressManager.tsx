"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { INDIAN_STATES_AND_UTS } from "@/domains/shipping/pin-service";

interface AddressItem {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  stateName: string;
  stateCode: string;
  pinCode: string;
  isDefault: boolean;
}

export function AddressManager({
  initialAddresses,
  defaultName,
  defaultPhone,
}: {
  initialAddresses: AddressItem[];
  defaultName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("Home");
  const [recipientName, setRecipientName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("27");
  const [pinCode, setPinCode] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          recipientName,
          phone,
          line1,
          line2,
          city,
          stateCode,
          pinCode,
          isDefault,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save address.");
        return;
      }
      setLine1("");
      setLine2("");
      setCity("");
      setPinCode("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-7">
        {initialAddresses.length === 0 ? (
          <p className="rounded-lg border border-pt-border bg-pt-surface-elevated p-6 text-xs text-pt-ink-muted">
            No saved Indian delivery addresses yet.
          </p>
        ) : (
          initialAddresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-pt-border bg-pt-surface-elevated p-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-pt-ink">{addr.label}</span>
                  {addr.isDefault && <Badge tone="tangerine">Default</Badge>}
                </div>
                <p className="mt-1 font-semibold text-pt-ink">
                  {addr.recipientName} (+91 {addr.phone})
                </p>
                <p className="mt-0.5 text-pt-ink-muted">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-pt-ink-muted">
                  {addr.city}, {addr.stateName} - {addr.pinCode}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${addr.label} address`}
                onClick={() => void handleDelete(addr.id)}
                className="rounded p-1.5 text-pt-ink-muted hover:bg-pt-silver hover:text-pt-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-5 lg:col-span-5"
      >
        <h2 className="font-display text-base font-bold text-pt-ink">
          Add Delivery Address
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="adr-label" className="block font-mono text-[0.6875rem] font-bold uppercase">
              Label
            </label>
            <input
              id="adr-label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 text-xs"
            />
          </div>
          <div>
            <label htmlFor="adr-phone" className="block font-mono text-[0.6875rem] font-bold uppercase">
              10-Digit Mobile
            </label>
            <input
              id="adr-phone"
              required
              maxLength={10}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 font-mono text-xs"
            />
          </div>
        </div>
        <div>
          <label htmlFor="adr-rec" className="block font-mono text-[0.6875rem] font-bold uppercase">
            Recipient Name
          </label>
          <input
            id="adr-rec"
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="adr-l1" className="block font-mono text-[0.6875rem] font-bold uppercase">
            Address Line 1
          </label>
          <input
            id="adr-l1"
            required
            minLength={4}
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2.5 text-xs"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="adr-city" className="block font-mono text-[0.6875rem] font-bold uppercase">
              City
            </label>
            <input
              id="adr-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2 text-xs"
            />
          </div>
          <div>
            <label htmlFor="adr-st" className="block font-mono text-[0.6875rem] font-bold uppercase">
              State
            </label>
            <select
              id="adr-st"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-1.5 text-xs"
            >
              {INDIAN_STATES_AND_UTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="adr-pin" className="block font-mono text-[0.6875rem] font-bold uppercase">
              PIN Code
            </label>
            <input
              id="adr-pin"
              required
              maxLength={6}
              value={pinCode}
              onChange={(e) =>
                setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="mt-1 h-9 w-full rounded border border-pt-border bg-pt-surface px-2 font-mono text-xs"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="accent-pt-tangerine"
          />
          <span>Set as default checkout address</span>
        </label>
        {error && <p className="text-xs text-pt-danger">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving..." : "Save Address"}
        </Button>
      </form>
    </div>
  );
}
