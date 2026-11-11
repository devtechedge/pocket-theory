import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AccountNav } from "@/components/account/AccountNav";
import { AddressManager } from "@/components/account/AddressManager";
import { getDb } from "@/db/client";
import { addresses } from "@/db/schema";
import { requirePageUser } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await requirePageUser("/account/addresses");
  const db = await getDb();
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(desc(addresses.isDefault));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AccountNav signedIn />
      <h1 className="mb-5 font-display text-2xl font-bold text-pt-ink">
        Indian Delivery Addresses
      </h1>
      <AddressManager
        initialAddresses={rows}
        defaultName={user.fullName}
        defaultPhone={user.phone ?? ""}
      />
    </div>
  );
}
