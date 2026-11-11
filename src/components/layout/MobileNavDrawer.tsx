"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MOBILE_LINKS = [
  { href: "/shop", label: "All 40 Products" },
  { href: "/category/power-charging", label: "Power & Charging (12)" },
  { href: "/category/audio", label: "Audio (9)" },
  { href: "/category/wearables-smart", label: "Wearables & Trackers (3)" },
  { href: "/category/desk-creator", label: "Desk & Creator Gear (11)" },
  { href: "/category/automotive-travel", label: "Automotive & Travel (5)" },
  { href: "/shop?under999=1", label: "Under ₹999 Edit" },
  { href: "/compare", label: "Compare Hardware" },
  { href: "/guides", label: "Buying Guides" },
  { href: "/track-order", label: "Track Order" },
  { href: "/account", label: "My Account & Orders" },
  { href: "/product-safety", label: "Product Safety & E-Waste" },
];

export function MobileNavDrawer({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        data-testid="mobile-menu-open"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-pt-border bg-pt-surface text-pt-ink hover:bg-pt-silver"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 flex"
        >
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50"
          />
          <nav className="relative z-10 flex h-full w-[min(86vw,20rem)] flex-col overflow-y-auto border-r border-pt-border-strong bg-pt-surface-elevated p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-pt-border pb-3">
              <span className="font-display text-sm font-bold tracking-wider text-pt-ink">
                POCKET THEORY
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-pt-border text-pt-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-3 space-y-1">
              {MOBILE_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-pt-ink hover:bg-pt-silver"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-2 block rounded-md bg-pt-cobalt-soft px-3 py-2 font-mono text-xs font-bold text-pt-cobalt-ink uppercase"
                  >
                    Admin Console
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
