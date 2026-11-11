"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6">
        <Badge tone="tangerine">New Customer Account</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold text-pt-ink">
          Create your account
        </h1>
        <p className="mt-1 text-xs text-pt-ink-muted">
          Track warranties, save Indian PIN addresses, and reorder cables or
          accessories in one click.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
            />
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              10-Digit Mobile (Optional)
            </label>
            <input
              id="reg-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9820012345"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="mt-1.5 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 font-mono text-sm text-pt-ink"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              Password (10+ characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded border border-pt-danger/30 bg-pt-danger-soft p-2.5 text-xs font-medium text-pt-danger-ink"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-pt-ink-muted">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-pt-cobalt hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
