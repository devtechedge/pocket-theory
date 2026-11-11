import "@fontsource-variable/sora";
import "@fontsource-variable/figtree";
import "@fontsource-variable/chivo-mono";
import "./globals.css";

import type { Metadata } from "next";
import { ThemeScript } from "@/components/chrome/ThemeScript";
import { CompareTray } from "@/components/compare/CompareTray";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StorefrontProvider } from "@/components/providers/StorefrontProvider";
import { getCurrentUser } from "@/domains/auth/session";
import { getHydratedCart } from "@/domains/cart/service";
import { listWishlistProductIds } from "@/domains/wishlist/service";
import { getSiteUrl, isDemoMode } from "@/env";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "POCKET THEORY | Useful tech. Zero fuss.",
    template: "%s | POCKET THEORY",
  },
  description:
    "Direct-to-consumer Indian personal electronics and everyday gadgets across power, audio, wearables, desk, and travel gear with transparent technical specs and INR GST checkout.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "POCKET THEORY",
    title: "POCKET THEORY | Useful tech. Zero fuss.",
    description:
      "40 thoughtfully engineered everyday electronics across charging, audio, wearables, desk, and automotive gear.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, cart, wishlistIds] = await Promise.all([
    getCurrentUser(),
    getHydratedCart(),
    listWishlistProductIds(),
  ]);

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col bg-pt-bg text-pt-ink antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <StorefrontProvider
          initialCartCount={cart.pricing.itemCount}
          initialWishlistIds={wishlistIds}
        >
          <SiteHeader user={user} demoMode={isDemoMode()} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <CompareTray />
          <SiteFooter />
        </StorefrontProvider>
      </body>
    </html>
  );
}
