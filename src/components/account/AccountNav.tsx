"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/returns", label: "Returns" },
];

export function AccountNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pt-border bg-pt-surface-elevated p-3">
      <nav aria-label="Account sections" className="flex flex-wrap gap-1.5">
        {ACCOUNT_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-pt-ink text-pt-surface-elevated"
                  : "text-pt-ink-muted hover:bg-pt-silver hover:text-pt-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {signedIn && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          data-testid="account-logout"
        >
          Sign Out
        </Button>
      )}
    </div>
  );
}
