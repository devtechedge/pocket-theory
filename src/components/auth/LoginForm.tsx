"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { sanitizeInternalPath } from "@/lib/security/redirect";

export { sanitizeInternalPath };

const DEMO_ACCOUNTS = [
  {
    label: "Customer",
    email: "customer@pockettheory.demo",
    note: "Orders, addresses, wishlist & returns",
  },
  {
    label: "Support Ops",
    email: "support@pockettheory.demo",
    note: "Fulfilment, returns & customer lookup",
  },
  {
    label: "Catalog Manager",
    email: "catalog@pockettheory.demo",
    note: "Products, compliance gate, stock & promos",
  },
  {
    label: "Super Admin",
    email: "admin@pockettheory.demo",
    note: "Full console, RBAC users & audit log",
  },
];

export function LoginForm({
  demoMode,
  nextPath,
}: {
  demoMode: boolean;
  nextPath: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const safeNext = sanitizeInternalPath(nextPath);

  async function submitCredentials(targetEmail: string, targetPassword: string) {
    setBusy(true);
    setError(null);
    setResetNotice(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        return;
      }
      const dest =
        safeNext === "/account" &&
        data.user?.role &&
        data.user.role !== "CUSTOMER"
          ? "/admin"
          : safeNext;
      router.push(dest);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      setError("Enter your email address first to request a reset.");
      return;
    }
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { message?: string; error?: string };
    if (res.ok) setResetNotice(data.message ?? "Reset queued.");
    else setError(data.error ?? "Request throttled.");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6">
        <Badge tone="cobalt">Account Access</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold text-pt-ink">
          Sign in to Pocket Theory
        </h1>
        <p className="mt-1 text-xs text-pt-ink-muted">
          View order invoices, manage Indian delivery addresses, or open role
          consoles. Guest checkout is also supported without an account.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitCredentials(email, password);
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label
              htmlFor="login-email"
              className="block font-mono text-xs font-bold text-pt-ink uppercase"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email"
              className="mt-1.5 h-10 w-full rounded-md border border-pt-border-strong bg-pt-surface px-3 text-sm text-pt-ink"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block font-mono text-xs font-bold text-pt-ink uppercase"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleForgot}
                className="font-mono text-[0.6875rem] font-semibold text-pt-cobalt hover:underline"
              >
                Reset password
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password"
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
          {resetNotice && (
            <p
              role="status"
              className="rounded border border-pt-cobalt/30 bg-pt-cobalt-soft p-2.5 text-xs text-pt-cobalt-ink"
            >
              {resetNotice}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={busy}
            data-testid="login-submit"
            className="w-full"
          >
            {busy ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-pt-ink-muted">
          New to Pocket Theory?{" "}
          <Link
            href="/register"
            className="font-semibold text-pt-cobalt hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>

      {demoMode && (
        <div
          data-testid="demo-credentials-panel"
          className="rounded-xl border border-pt-border bg-pt-surface p-5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-pt-ink uppercase">
              Demo Environment Accounts
            </span>
            <Badge tone="amber">DEMO_MODE=1</Badge>
          </div>
          <p className="mt-1 text-xs text-pt-ink-muted">
            Click a role below to sign in immediately (shared demo password:{" "}
            <code className="font-mono font-bold text-pt-ink">
              PocketTheory-Demo-2026!
            </code>
            ).
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={busy}
                data-testid={`demo-login-${acc.label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("PocketTheory-Demo-2026!");
                  void submitCredentials(acc.email, "PocketTheory-Demo-2026!");
                }}
                className="rounded-md border border-pt-border bg-pt-surface-elevated p-2.5 text-left transition-colors hover:border-pt-tangerine"
              >
                <div className="font-mono text-xs font-bold text-pt-ink">
                  {acc.label}
                </div>
                <div className="truncate font-mono text-[0.65rem] text-pt-cobalt">
                  {acc.email}
                </div>
                <div className="mt-0.5 text-[0.6875rem] text-pt-ink-muted">
                  {acc.note}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
