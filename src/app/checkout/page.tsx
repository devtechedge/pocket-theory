import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/cart/CheckoutFlow";
import { getDb } from "@/db/client";
import { addresses } from "@/db/schema";
import { getCurrentUser } from "@/domains/auth/session";
import { getHydratedCart } from "@/domains/cart/service";
import { getActivePaymentCapabilities } from "@/domains/payments/adapters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [user, cart] = await Promise.all([getCurrentUser(), getHydratedCart()]);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  let savedAddresses: Array<typeof addresses.$inferSelect> = [];
  if (user) {
    const db = await getDb();
    savedAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(desc(addresses.isDefault));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
          Secure INR Checkout // Integer-Paise Server Totals
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
          Checkout
        </h1>
      </div>

      <CheckoutFlow
        initialCart={cart}
        initialUser={user}
        savedAddresses={savedAddresses}
        paymentCapabilities={getActivePaymentCapabilities()}
      />
    </div>
  );
}
