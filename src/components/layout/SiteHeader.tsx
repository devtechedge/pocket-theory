"use client";

import { Heart, Scale, ShieldCheck, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { SearchBar } from "@/components/search/SearchBar";
import type { UserRole } from "@/db/schema";
import { MobileNavDrawer } from "./MobileNavDrawer";

interface SiteHeaderProps {
  user: {
    email: string;
    fullName: string;
    role: UserRole;
  } | null;
  demoMode: boolean;
}

const DESKTOP_CATEGORIES = [
  { href: "/shop", label: "Shop All" },
  { href: "/category/power-charging", label: "Power & Charging" },
  { href: "/category/audio", label: "Audio" },
  { href: "/category/wearables-smart", label: "Wearables" },
  { href: "/category/desk-creator", label: "Desk & Creator" },
  { href: "/category/automotive-travel", label: "Auto & Travel" },
  { href: "/shop?under999=1", label: "Under ₹999" },
  { href: "/guides", label: "Guides" },
  { href: "/track-order", label: "Track Order" },
];

export function SiteHeader({ user, demoMode }: SiteHeaderProps) {
  const { cartItemCount, wishlistIds, compareItems } = useStorefront();
  const isAdmin =
    user != null &&
    ["SUPPORT_OPS", "CATALOG_MANAGER", "SUPER_ADMIN"].includes(user.role);

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-30 border-b border-pt-border bg-pt-surface-elevated/95 backdrop-blur"
    >
      {/* Top utility & honest demo notice strip */}
      <div className="border-b border-pt-border bg-pt-paper px-3 py-1.5 text-[0.6875rem] text-pt-ink-muted sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 truncate font-mono">
            {demoMode
              ? "DEMO STOREFRONT: Non-charging INR sandbox - specs & prices are illustrative."
              : "Free standard insured dispatch across India on orders ₹999+"}
          </p>
          <div className="hidden items-center gap-4 font-mono sm:flex">
            <span>Free Shipping ₹999+</span>
            <span>GST Invoice Included</span>
            <Link href="/brand/pocket-theory" className="hover:text-pt-ink hover:underline">
              House Standard
            </Link>
          </div>
        </div>
      </div>

      {/* Primary bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNavDrawer isAdmin={isAdmin} />
          <Link href="/" aria-label="Pocket Theory home" className="min-w-0">
            <span className="sm:hidden">
              <Logo compact />
            </span>
            <span className="hidden sm:inline-flex">
              <Logo />
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              data-testid="header-admin-link"
              className="hidden h-9 items-center gap-1.5 rounded-md border border-pt-cobalt/35 bg-pt-cobalt-soft px-2.5 font-mono text-xs font-bold text-pt-cobalt-ink hover:opacity-90 sm:inline-flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}

          <Link
            href={
              compareItems.length > 0
                ? `/compare?skus=${encodeURIComponent(
                    compareItems.map((c) => c.slug).join(","),
                  )}`
                : "/compare"
            }
            aria-label={`Compare products (${compareItems.length} selected)`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-pt-border bg-pt-surface text-pt-ink hover:bg-pt-silver sm:w-auto sm:px-2.5"
          >
            <Scale className="h-4 w-4" />
            <span className="ml-1.5 hidden font-mono text-xs font-semibold lg:inline">
              {compareItems.length}
            </span>
          </Link>

          <Link
            href="/account/wishlist"
            aria-label={`Wishlist (${wishlistIds.size} saved)`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-pt-border bg-pt-surface text-pt-ink hover:bg-pt-silver sm:w-auto sm:px-2.5"
          >
            <Heart className="h-4 w-4" />
            <span className="ml-1.5 hidden font-mono text-xs font-semibold lg:inline">
              {wishlistIds.size}
            </span>
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? `Account (${user.fullName})` : "Sign in"}
            data-testid="header-account-link"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-pt-border bg-pt-surface text-pt-ink hover:bg-pt-silver sm:w-auto sm:px-2.5"
          >
            <User className="h-4 w-4" />
            <span className="ml-1.5 hidden max-w-[6.5rem] truncate text-xs font-semibold xl:inline">
              {user ? user.fullName.split(" ")[0] : "Sign in"}
            </span>
          </Link>

          <Link
            href="/cart"
            aria-label={`Shopping cart with ${cartItemCount} items`}
            data-testid="header-cart-link"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-pt-ink px-2.5 text-pt-surface-elevated transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" />
            <span
              data-testid="header-cart-count"
              className="font-mono text-xs font-bold"
            >
              {cartItemCount}
            </span>
          </Link>

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile inline search bar */}
      <div className="border-t border-pt-border px-3 py-2 md:hidden">
        <SearchBar />
      </div>

      {/* Desktop category rail */}
      <nav
        aria-label="Catalogue categories"
        className="hidden border-t border-pt-border bg-pt-surface lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-2">
          {DESKTOP_CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="shrink-0 text-xs font-semibold tracking-wide text-pt-ink-muted transition-colors hover:text-pt-ink"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
