import type { DiscountType, ShippingMethod } from "@/db/schema";
import {
  assertIntegerPaise,
  computeInclusiveGstBreakup,
  SUPPLIER_ORIGIN_STATE_CODE,
  type GstBreakup,
} from "@/lib/money";

export interface PricingLineInput {
  variantId: string;
  unitPricePaise: number;
  quantity: number;
  gstRateBps?: number;
}

export interface CouponRuleInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minSubtotalPaise: number;
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
}

export interface CartPricingBreakdown {
  itemCount: number;
  subtotalPaise: number;
  discountPaise: number;
  appliedCouponCode: string | null;
  couponRejectionReason: string | null;
  discountedSubtotalPaise: number;
  shippingMethod: ShippingMethod;
  shippingPaise: number;
  freeStandardThresholdPaise: number;
  amountToFreeShippingPaise: number;
  grandTotalPaise: number;
  gst: GstBreakup;
}

export const DEFAULT_FREE_STANDARD_THRESHOLD_PAISE = 99_900; // ₹999
export const DEFAULT_STANDARD_SHIPPING_FEE_PAISE = 7_900; // ₹79
export const DEFAULT_FREE_EXPRESS_THRESHOLD_PAISE = 499_900; // ₹4,999
export const DEFAULT_EXPRESS_SHIPPING_FEE_PAISE = 14_900; // ₹149

export function calculateCartPricing(params: {
  lines: PricingLineInput[];
  coupon?: CouponRuleInput | null;
  shippingMethod?: ShippingMethod;
  destinationStateCode?: string;
  now?: Date;
  freeStandardThresholdPaise?: number;
  standardFeePaise?: number;
  freeExpressThresholdPaise?: number;
  expressFeePaise?: number;
}): CartPricingBreakdown {
  const shippingMethod: ShippingMethod = params.shippingMethod ?? "STANDARD";
  const destinationStateCode =
    params.destinationStateCode ?? SUPPLIER_ORIGIN_STATE_CODE;
  const freeStandardThresholdPaise =
    params.freeStandardThresholdPaise ?? DEFAULT_FREE_STANDARD_THRESHOLD_PAISE;
  const standardFeePaise =
    params.standardFeePaise ?? DEFAULT_STANDARD_SHIPPING_FEE_PAISE;
  const freeExpressThresholdPaise =
    params.freeExpressThresholdPaise ?? DEFAULT_FREE_EXPRESS_THRESHOLD_PAISE;
  const expressFeePaise =
    params.expressFeePaise ?? DEFAULT_EXPRESS_SHIPPING_FEE_PAISE;
  const now = params.now ?? new Date();

  let itemCount = 0;
  let subtotalPaise = 0;

  for (const line of params.lines) {
    assertIntegerPaise(line.unitPricePaise, "line.unitPricePaise");
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new Error(`Invalid line quantity: ${line.quantity}`);
    }
    itemCount += line.quantity;
    subtotalPaise += line.unitPricePaise * line.quantity;
  }

  let discountPaise = 0;
  let appliedCouponCode: string | null = null;
  let couponRejectionReason: string | null = null;

  if (params.coupon && subtotalPaise > 0) {
    const c = params.coupon;
    if (!c.isActive) {
      couponRejectionReason = `Promo code ${c.code} is currently inactive.`;
    } else if (c.expiresAt && c.expiresAt.getTime() <= now.getTime()) {
      couponRejectionReason = `Promo code ${c.code} has expired.`;
    } else if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
      couponRejectionReason = `Promo code ${c.code} has reached its redemption limit.`;
    } else if (subtotalPaise < c.minSubtotalPaise) {
      couponRejectionReason = `Promo code ${c.code} requires a minimum subtotal of ₹${Math.ceil(
        c.minSubtotalPaise / 100,
      )}.`;
    } else {
      let rawDiscount =
        c.discountType === "PERCENTAGE"
          ? Math.floor((subtotalPaise * c.discountValue) / 100)
          : c.discountValue;
      if (c.maxDiscountPaise != null) {
        rawDiscount = Math.min(rawDiscount, c.maxDiscountPaise);
      }
      discountPaise = Math.max(0, Math.min(rawDiscount, subtotalPaise));
      appliedCouponCode = c.code;
    }
  }

  const discountedSubtotalPaise = subtotalPaise - discountPaise;

  let shippingPaise = 0;
  if (subtotalPaise > 0) {
    if (shippingMethod === "EXPRESS") {
      shippingPaise =
        discountedSubtotalPaise >= freeExpressThresholdPaise
          ? 0
          : expressFeePaise;
    } else {
      shippingPaise =
        discountedSubtotalPaise >= freeStandardThresholdPaise
          ? 0
          : standardFeePaise;
    }
  }

  const amountToFreeShippingPaise =
    subtotalPaise === 0
      ? freeStandardThresholdPaise
      : Math.max(0, freeStandardThresholdPaise - discountedSubtotalPaise);

  const grandTotalPaise = discountedSubtotalPaise + shippingPaise;
  const gst = computeInclusiveGstBreakup(
    grandTotalPaise,
    1800,
    destinationStateCode,
  );

  return {
    itemCount,
    subtotalPaise,
    discountPaise,
    appliedCouponCode,
    couponRejectionReason,
    discountedSubtotalPaise,
    shippingMethod,
    shippingPaise,
    freeStandardThresholdPaise,
    amountToFreeShippingPaise,
    grandTotalPaise,
    gst,
  };
}
