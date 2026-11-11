"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CompareTrayEntry {
  slug: string;
  title: string;
  sku: string;
  imageUrl: string;
  pricePaise: number;
}

interface StorefrontContextValue {
  cartItemCount: number;
  wishlistIds: Set<string>;
  compareItems: CompareTrayEntry[];
  recentlyViewedSlugs: string[];
  toastMessage: string | null;
  dismissToast: () => void;
  showToast: (msg: string) => void;
  refreshCartCount: (nextCount?: number) => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<void>;
  toggleCompare: (entry: CompareTrayEntry) => void;
  removeCompare: (slug: string) => void;
  clearCompare: () => void;
  recordRecentlyViewed: (slug: string) => void;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

const COMPARE_STORAGE_KEY = "pt-compare-v1";
const RECENT_STORAGE_KEY = "pt-recent-v1";

export function StorefrontProvider({
  initialCartCount,
  initialWishlistIds,
  children,
}: {
  initialCartCount: number;
  initialWishlistIds: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [cartItemCount, setCartItemCount] = useState(initialCartCount);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    () => new Set(initialWishlistIds),
  );
  const [compareItems, setCompareItems] = useState<CompareTrayEntry[]>([]);
  const [recentlyViewedSlugs, setRecentlyViewedSlugs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCartItemCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    setWishlistIds(new Set(initialWishlistIds));
  }, [initialWishlistIds]);

  useEffect(() => {
    try {
      const rawCompare = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      if (rawCompare) {
        const parsed = JSON.parse(rawCompare);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCompareItems(parsed.slice(0, 4));
        }
      }
      const rawRecent = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (rawRecent) {
        const parsedRecent = JSON.parse(rawRecent);
        if (Array.isArray(parsedRecent)) {
          setRecentlyViewedSlugs(
            parsedRecent.filter((s): s is string => typeof s === "string").slice(0, 8),
          );
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const refreshCartCount = useCallback(async (nextCount?: number) => {
    if (typeof nextCount === "number") {
      setCartItemCount(nextCount);
      return;
    }
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        cart?: { pricing?: { itemCount?: number } };
      };
      setCartItemCount(data.cart?.pricing?.itemCount ?? 0);
    }
  }, []);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1): Promise<boolean> => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity, mode: "add" }),
      });
      const data = (await res.json()) as {
        error?: string;
        cart?: { pricing?: { itemCount?: number } };
      };
      if (!res.ok) {
        showToast(data.error ?? "Could not add item to cart.");
        return false;
      }
      setCartItemCount(data.cart?.pricing?.itemCount ?? 0);
      showToast("Added to cart.");
      router.refresh();
      return true;
    },
    [router, showToast],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = (await res.json()) as {
        wished?: boolean;
        productIds?: string[];
        error?: string;
      };
      if (!res.ok) {
        showToast(data.error ?? "Unable to update wishlist.");
        return;
      }
      setWishlistIds(new Set(data.productIds ?? []));
      showToast(data.wished ? "Saved to wishlist." : "Removed from wishlist.");
      router.refresh();
    },
    [router, showToast],
  );

  const persistCompare = useCallback((next: CompareTrayEntry[]) => {
    setCompareItems(next);
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  }, []);

  const toggleCompare = useCallback(
    (entry: CompareTrayEntry) => {
      setCompareItems((prev) => {
        const exists = prev.some((p) => p.slug === entry.slug);
        let next: CompareTrayEntry[];
        if (exists) {
          next = prev.filter((p) => p.slug !== entry.slug);
          showToast(`Removed ${entry.title} from comparison.`);
        } else if (prev.length >= 4) {
          showToast("Compare tray holds up to 4 items at once.");
          return prev;
        } else {
          next = [...prev, entry];
          showToast(`Added ${entry.title} to compare tray (${next.length}/4).`);
        }
        try {
          window.localStorage.setItem(
            COMPARE_STORAGE_KEY,
            JSON.stringify(next),
          );
        } catch {
          // Ignore
        }
        return next;
      });
    },
    [showToast],
  );

  const removeCompare = useCallback(
    (slug: string) => {
      persistCompare(compareItems.filter((c) => c.slug !== slug));
    },
    [compareItems, persistCompare],
  );

  const clearCompare = useCallback(() => {
    persistCompare([]);
  }, [persistCompare]);

  const recordRecentlyViewed = useCallback((slug: string) => {
    setRecentlyViewedSlugs((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<StorefrontContextValue>(
    () => ({
      cartItemCount,
      wishlistIds,
      compareItems,
      recentlyViewedSlugs,
      toastMessage,
      dismissToast,
      showToast,
      refreshCartCount,
      addToCart,
      toggleWishlist,
      toggleCompare,
      removeCompare,
      clearCompare,
      recordRecentlyViewed,
    }),
    [
      cartItemCount,
      wishlistIds,
      compareItems,
      recentlyViewedSlugs,
      toastMessage,
      dismissToast,
      showToast,
      refreshCartCount,
      addToCart,
      toggleWishlist,
      toggleCompare,
      removeCompare,
      clearCompare,
      recordRecentlyViewed,
    ],
  );

  return (
    <StorefrontContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          data-testid="storefront-toast"
          className="fixed right-4 bottom-20 z-50 flex max-w-sm items-center gap-3 rounded-md border border-pt-border-strong bg-pt-ink px-4 py-2.5 text-xs font-medium text-pt-surface-elevated shadow-lg"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="ml-auto font-mono text-xs opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) {
    throw new Error("useStorefront must be used inside StorefrontProvider");
  }
  return ctx;
}
