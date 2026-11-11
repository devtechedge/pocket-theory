import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { products, wishlistItems } from "@/db/schema";
import {
  getCurrentUser,
  getOrCreateGuestTokenHash,
  readGuestTokenHash,
} from "@/domains/auth/session";
import { getCardsBySlugs, type CatalogCardItem } from "@/domains/catalog/service";

export async function listWishlistProductIds(): Promise<string[]> {
  const db = await getDb();
  const user = await getCurrentUser();
  if (user) {
    const rows = await db
      .select({ productId: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, user.id));
    return Array.from(new Set(rows.map((r) => r.productId)));
  }

  const guestHash = await readGuestTokenHash();
  if (!guestHash) return [];
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.guestTokenHash, guestHash));
  return Array.from(new Set(rows.map((r) => r.productId)));
}

export async function listWishlistCards(): Promise<CatalogCardItem[]> {
  const ids = await listWishlistProductIds();
  if (ids.length === 0) return [];
  const db = await getDb();
  const prodRows = await db
    .select({ id: products.id, slug: products.slug })
    .from(products);
  const idSet = new Set(ids);
  const slugs = prodRows.filter((p) => idSet.has(p.id)).map((p) => p.slug);
  return getCardsBySlugs(slugs);
}

export async function toggleWishlistProduct(
  productId: string,
): Promise<{ wished: boolean; productIds: string[] }> {
  const db = await getDb();
  const user = await getCurrentUser();
  const guestHash = user ? null : await getOrCreateGuestTokenHash();

  const existing = user
    ? await db
        .select()
        .from(wishlistItems)
        .where(
          and(
            eq(wishlistItems.userId, user.id),
            eq(wishlistItems.productId, productId),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(wishlistItems)
        .where(
          and(
            eq(wishlistItems.guestTokenHash, guestHash!),
            eq(wishlistItems.productId, productId),
          ),
        )
        .limit(1);

  let wished = false;
  if (existing[0]) {
    await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.id, existing[0].id));
    wished = false;
  } else {
    await db.insert(wishlistItems).values({
      id: `wsh-${randomBytes(10).toString("hex")}`,
      userId: user?.id ?? null,
      guestTokenHash: user ? null : guestHash,
      productId,
    });
    wished = true;
  }

  const productIds = await listWishlistProductIds();
  return { wished, productIds };
}
