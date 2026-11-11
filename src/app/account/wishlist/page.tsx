import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/AccountNav";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getCurrentUser } from "@/domains/auth/session";
import { listWishlistCards } from "@/domains/wishlist/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Wishlist",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const [user, items] = await Promise.all([
    getCurrentUser(),
    listWishlistCards(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AccountNav signedIn={Boolean(user)} />

      <div className="mb-6">
        <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Saved Hardware ({items.length})
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink">
          Wishlist
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-pt-border bg-pt-surface-elevated p-10 text-center">
          <p className="text-sm font-semibold text-pt-ink">
            No gadgets saved to your wishlist yet.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-pt-tangerine px-5 text-xs font-semibold text-pt-on-tangerine"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
