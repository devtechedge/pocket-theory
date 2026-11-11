"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/db/schema";

export function UserRoleRow({
  user,
  isSelf,
}: {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
  };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role, isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="text-xs">
      <td className="px-4 py-3">
        <div className="font-semibold text-pt-ink">{user.fullName}</div>
        <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
          {user.email}
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          aria-label={`Role for ${user.email}`}
          disabled={isSelf}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="h-8 rounded border border-pt-border bg-pt-surface px-2 font-mono text-xs disabled:opacity-60"
        >
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="SUPPORT_OPS">SUPPORT_OPS</option>
          <option value="CATALOG_MANAGER">CATALOG_MANAGER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            disabled={isSelf}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-pt-tangerine"
          />
          <span>{isActive ? "Active" : "Suspended"}</span>
        </label>
      </td>
      <td className="px-4 py-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={isSelf || busy}
          onClick={save}
        >
          {isSelf ? "Current Session" : busy ? "..." : "Apply"}
        </Button>
      </td>
    </tr>
  );
}

export function CheckoutKillSwitch({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !enabled;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutEnabled: next }),
      });
      if (res.ok) {
        setEnabled(next);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-5 text-xs">
      <div>
        <h2 className="font-display text-base font-bold text-pt-ink">
          Global Checkout Intake Switch
        </h2>
        <p className="mt-0.5 text-pt-ink-muted">
          Status:{" "}
          <strong className="font-mono text-pt-ink">
            {enabled ? "ENABLED (Accepting Orders)" : "PAUSED (Maintenance Hold)"}
          </strong>
        </p>
      </div>
      <Button
        variant={enabled ? "danger" : "primary"}
        size="sm"
        disabled={busy}
        onClick={toggle}
      >
        {enabled ? "Pause Checkout" : "Resume Checkout"}
      </Button>
    </div>
  );
}
