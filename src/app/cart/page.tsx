import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getHydratedCart } from "@/domains/cart/service";
import { queryCatalog } from "@/domains/catalog/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [cart, under999] = await Promise.all([
    getHydratedCart(),
    queryCatalog({ under999: true, sort: "featured", pageSize: 6 }),
  ]);

  const inCartProductIds = new Set(cart.items.map((i) => i.productId));
  const crossSells = under999.items
    .filter((i) => !inCartProductIds.has(i.id))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Bag & Promo Summary
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
          Shopping Cart
        </h1>
      </div>
      <CartView initialCart={cart} crossSells={crossSells} />
    </div>
  );
}
