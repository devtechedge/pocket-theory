"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        setStatusMsg(data.message ?? "Subscribed.");
        setEmail("");
      } else {
        setStatusMsg(data.error ?? "Could not subscribe.");
      }
    } catch {
      setStatusMsg("Network error. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="mt-16 border-t border-pt-border-strong bg-pt-surface-elevated text-pt-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-pt-ink-muted">
              Single-brand Indian direct-to-consumer personal electronics and
              everyday hardware. Clear specifications, integer-paise GST
              invoices, and zero countdown gimmicks.
            </p>

            <form onSubmit={onSubscribe} className="mt-5 max-w-sm">
              <label
                htmlFor="footer-newsletter-email"
                className="block font-mono text-xs font-semibold text-pt-ink uppercase"
              >
                Hardware Dispatches & Buying Guides
              </label>
              <div className="mt-2 flex flex-wrap gap-2 sm:flex-nowrap">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.in"
                  className="h-10 min-w-0 flex-1 rounded-md border border-pt-border bg-pt-surface px-3 text-sm text-pt-ink placeholder:text-pt-ink-muted"
                />
                <Button type="submit" disabled={busy} size="md">
                  {busy ? "Saving..." : "Subscribe"}
                </Button>
              </div>
              {statusMsg && (
                <p
                  role="status"
                  className="mt-2 font-mono text-xs text-pt-cobalt"
                >
                  {statusMsg}
                </p>
              )}
            </form>
          </div>

          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider text-pt-ink uppercase">
              Catalogue
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-pt-ink-muted">
              <li>
                <Link href="/category/power-charging" className="hover:text-pt-ink">
                  Power & Charging (12)
                </Link>
              </li>
              <li>
                <Link href="/category/audio" className="hover:text-pt-ink">
                  Audio (9)
                </Link>
              </li>
              <li>
                <Link href="/category/wearables-smart" className="hover:text-pt-ink">
                  Wearables & Smart (3)
                </Link>
              </li>
              <li>
                <Link href="/category/desk-creator" className="hover:text-pt-ink">
                  Desk & Creator Gear (11)
                </Link>
              </li>
              <li>
                <Link href="/category/automotive-travel" className="hover:text-pt-ink">
                  Automotive & Travel (5)
                </Link>
              </li>
              <li>
                <Link href="/shop?under999=1" className="hover:text-pt-ink">
                  Under ₹999 Discovery
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-pt-ink">
                  Side-by-Side Compare
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider text-pt-ink uppercase">
              Support & Guides
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-pt-ink-muted">
              <li>
                <Link href="/guides" className="hover:text-pt-ink">
                  Technical Buying Guides
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-pt-ink">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-pt-ink">
                  Shipping & PIN Coverage
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-pt-ink">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-pt-ink">
                  Warranty Terms
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-pt-ink">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-pt-ink">
                  Contact & Grievance Officer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider text-pt-ink uppercase">
              Brand & Compliance
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-pt-ink-muted">
              <li>
                <Link href="/about" className="hover:text-pt-ink">
                  About Pocket Theory
                </Link>
              </li>
              <li>
                <Link href="/brand/pocket-theory" className="hover:text-pt-ink">
                  House Brand Standard
                </Link>
              </li>
              <li>
                <Link href="/product-safety" className="hover:text-pt-ink">
                  Product Safety, Lithium & E-Waste
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-pt-ink">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-pt-ink">
                  Terms of Sale
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-pt-border pt-6 text-xs leading-relaxed text-pt-ink-muted">
          <p>
            <strong>Demonstration Notice:</strong> POCKET THEORY is a reference
            direct-to-consumer electronics application for India (INR,
            Asia/Kolkata). All 40 SKUs, specifications, prices, and compliance
            placeholders are illustrative demo records; checkout defaults to an
            explicitly labelled non-charging payment sandbox unless live gateway
            credentials are configured.
          </p>
          <p className="mt-2 font-mono">
            © 2026 POCKET THEORY (Demo House Entity - Mumbai, Maharashtra). All
            prices shown in ₹ inclusive of GST.
          </p>
        </div>
      </div>
    </footer>
  );
}
