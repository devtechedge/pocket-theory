import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cartItems,
  carts,
  coupons,
  products,
  productVariants,
  type ShippingMethod,
} from "@/db/schema";
import {
  getCurrentUser,
  getOrCreateGuestTokenHash,
  readGuestTokenHash,
} from "@/domains/auth/session";
import { isProductPubliclyVisible } from "@/domains/compliance/gate";
import {
  calculateCartPricing,
  type CartPricingBreakdown,
} from "@/domains/pricing/calculator";
import { isDemoMode } from "@/env";
import { SUPPLIER_ORIGIN_STATE_CODE } from "@/lib/money";

export interface HydratedCartItem {
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  sku: string;
  variantLabel: string;
  colorHex: string;
  imageUrl: string;
  unitPricePaise: number;
  mrpPaise: number;
  quantity: number;
  availableStock: number;
  lineTotalPaise: number;
  warrantyMonths: number;
  returnWindowDays: number;
  hsnCode: string;
  gstRateBps: number;
}

export interface HydratedCartView {
  cartId: string | null;
  items: HydratedCartItem[];
  pricing: CartPricingBreakdown;
  requestedCouponCode: string | null;
}

async function resolveActiveCartRow(options: { createIfMissing: boolean }) {
  const db = await getDb();
  const user = await getCurrentUser();
  const guestHash = options.createIfMissing
    ? await getOrCreateGuestTokenHash()
    : await readGuestTokenHash();

  if (user) {
    const [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);

    if (userCart) return userCart;

    if (guestHash) {
      const [guestCart] = await db
        .select()
        .from(carts)
        .where(eq(carts.tokenHash, guestHash))
        .limit(1);
      if (guestCart) {
        await db
          .update(carts)
          .set({ userId: user.id, updatedAt: new Date() })
          .where(eq(carts.id, guestCart.id));
        return { ...guestCart, userId: user.id };
      }
    }

    if (!options.createIfMissing) return null;

    const newCart = {
      id: `crt-${randomBytes(10).toString("hex")}`,
      tokenHash: guestHash ?? `usr-${user.id}-${randomBytes(8).toString("hex")}`,
      userId: user.id,
      couponCode: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(carts).values(newCart);
    return newCart;
  }

  if (!guestHash) return null;

  const [guestCart] = await db
    .select()
    .from(carts)
    .where(eq(carts.tokenHash, guestHash))
    .limit(1);

  if (guestCart || !options.createIfMissing) {
    return guestCart ?? null;
  }

  const newCart = {
    id: `crt-${randomBytes(10).toString("hex")}`,
    tokenHash: guestHash,
    userId: null,
    couponCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(carts).values(newCart);
  return newCart;
}

export async function getHydratedCart(options?: {
  shippingMethod?: ShippingMethod;
  destinationStateCode?: string;
}): Promise<HydratedCartView> {
  const db = await getDb();
  const demoMode = isDemoMode();
  const cartRow = await resolveActiveCartRow({ createIfMissing: false });

  if (!cartRow) {
    return {
      cartId: null,
      items: [],
      pricing: calculateCartPricing({
        lines: [],
        shippingMethod: options?.shippingMethod,
        destinationStateCode:
          options?.destinationStateCode ?? SUPPLIER_ORIGIN_STATE_CODE,
      }),
      requestedCouponCode: null,
    };
  }

  const rows = await db
    .select({
      cartItemId: cartItems.id,
      quantity: cartItems.quantity,
      product: products,
      variant: productVariants,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cartRow.id));

  const items: HydratedCartItem[] = [];
  for (const r of rows) {
    if (!isProductPubliclyVisible(r.product, { demoMode })) continue;
    if (r.variant.stock <= 0) continue;

    const clampedQty = Math.min(10, Math.min(r.quantity, r.variant.stock));
    const unitPricePaise =
      r.variant.priceOverridePaise ?? r.product.pricePaise;
    const mrpPaise = r.variant.mrpOverridePaise ?? r.product.mrpPaise;
    const imageUrl =
      r.product.images?.[0]?.url ?? `/products/${r.product.slug}-front.svg`;

    items.push({
      id: r.cartItemId,
      productId: r.product.id,
      variantId: r.variant.id,
      slug: r.product.slug,
      title: r.product.title,
      sku: r.variant.sku,
      variantLabel: r.variant.label,
      colorHex: r.variant.colorHex,
      imageUrl,
      unitPricePaise,
      mrpPaise,
      quantity: clampedQty,
      availableStock: r.variant.stock,
      lineTotalPaise: unitPricePaise * clampedQty,
      warrantyMonths: r.product.warrantyMonths,
      returnWindowDays: r.product.returnWindowDays,
      hsnCode: r.product.hsnCode,
      gstRateBps: r.product.gstRateBps,
    });
  }

  let couponRow = null;
  if (cartRow.couponCode) {
    const [found] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, cartRow.couponCode.toUpperCase()))
      .limit(1);
    couponRow = found ?? null;
  }

  const pricing = calculateCartPricing({
    lines: items.map((i) => ({
      variantId: i.variantId,
      unitPricePaise: i.unitPricePaise,
      quantity: i.quantity,
      gstRateBps: i.gstRateBps,
    })),
    coupon: couponRow,
    shippingMethod: options?.shippingMethod,
    destinationStateCode:
      options?.destinationStateCode ?? SUPPLIER_ORIGIN_STATE_CODE,
  });

  return {
    cartId: cartRow.id,
    items,
    pricing,
    requestedCouponCode: cartRow.couponCode,
  };
}

export async function upsertCartVariantQuantity(params: {
  variantId: string;
  quantity: number;
  mode: "add" | "set";
}): Promise<HydratedCartView> {
  const db = await getDb();
  const demoMode = isDemoMode();

  const [vRow] = await db
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, params.variantId))
    .limit(1);

  if (!vRow || !isProductPubliclyVisible(vRow.product, { demoMode })) {
    throw new Error("Selected product variant is unavailable.");
  }

  const cartRow = await resolveActiveCartRow({ createIfMissing: true });
  if (!cartRow) {
    throw new Error("Could not initialize shopping cart.");
  }

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartRow.id),
        eq(cartItems.variantId, params.variantId),
      ),
    )
    .limit(1);

  const desired =
    params.mode === "add"
      ? (existing?.quantity ?? 0) + params.quantity
      : params.quantity;

  if (desired <= 0) {
    if (existing) {
      await db.delete(cartItems).where(eq(cartItems.id, existing.id));
    }
    return getHydratedCart();
  }

  if (vRow.variant.stock <= 0) {
    throw new Error(`${vRow.product.title} (${vRow.variant.label}) is out of stock.`);
  }

  const finalQty = Math.min(10, Math.min(desired, vRow.variant.stock));

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: finalQty })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      id: `ci-${randomBytes(10).toString("hex")}`,
      cartId: cartRow.id,
      productId: vRow.product.id,
      variantId: vRow.variant.id,
      quantity: finalQty,
    });
  }

  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartRow.id));

  return getHydratedCart();
}

export async function applyCouponToActiveCart(
  code: string | null,
): Promise<HydratedCartView> {
  const db = await getDb();
  const cartRow = await resolveActiveCartRow({ createIfMissing: true });
  if (!cartRow) {
    throw new Error("Could not access cart.");
  }

  const normalized = code?.trim().toUpperCase() || null;
  if (normalized) {
    const [found] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, normalized))
      .limit(1);
    if (!found || !found.isActive) {
      throw new Error(`Promo code "${normalized}" was not recognized.`);
    }
  }

  await db
    .update(carts)
    .set({ couponCode: normalized, updatedAt: new Date() })
    .where(eq(carts.id, cartRow.id));

  return getHydratedCart();
}

export async function clearCartById(cartId: string): Promise<void> {
  const db = await getDb();
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db
    .update(carts)
    .set({ couponCode: null, updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}
