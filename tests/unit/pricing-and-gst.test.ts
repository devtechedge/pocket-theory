import { describe, expect, it } from "vitest";
import { calculateCartPricing } from "@/domains/pricing/calculator";
import {
  computeInclusiveGstBreakup,
  computeSavingsPercent,
  formatPaise,
  rupeesToPaise,
} from "@/lib/money";

describe("Integer-paise INR money & GST breakup", () => {
  it("formats integer paise into Indian INR currency strings and rejects floats", () => {
    expect(formatPaise(49900)).toBe("₹499");
    expect(formatPaise(149900)).toBe("₹1,499");
    expect(formatPaise(242820)).toBe("₹2,428.20");
    expect(rupeesToPaise(999)).toBe(99900);
    expect(() => formatPaise(99.5)).toThrow(/integer in paise/);
  });

  it("computes savings percent safely", () => {
    expect(computeSavingsPercent(129900, 179900)).toBe(28);
    expect(computeSavingsPercent(129900, 129900)).toBe(0);
    expect(computeSavingsPercent(129900, null)).toBe(0);
  });

  it("splits intra-state Maharashtra (27) GST into CGST + SGST with zero rounding drift", () => {
    const res = computeInclusiveGstBreakup(129901, 1800, "27");
    expect(res.supplyType).toBe("INTRA_STATE");
    expect(res.igstPaise).toBe(0);
    expect(res.cgstPaise).toBeGreaterThan(0);
    expect(res.sgstPaise).toBeGreaterThan(0);
    expect(res.taxableValuePaise + res.cgstPaise + res.sgstPaise).toBe(129901);
  });

  it("assigns full 18% IGST on inter-state supplies outside Maharashtra", () => {
    const res = computeInclusiveGstBreakup(219900, 1800, "29"); // Karnataka
    expect(res.supplyType).toBe("INTER_STATE");
    expect(res.cgstPaise).toBe(0);
    expect(res.sgstPaise).toBe(0);
    expect(res.igstPaise).toBeGreaterThan(0);
    expect(res.taxableValuePaise + res.igstPaise).toBe(219900);
  });
});

describe("Cart pricing, discount caps & shipping thresholds", () => {
  it("charges ₹79 shipping below ₹999 and unlocks free shipping at ₹999+", () => {
    const under = calculateCartPricing({
      lines: [{ variantId: "v1", unitPricePaise: 69900, quantity: 1 }],
    });
    expect(under.shippingPaise).toBe(7900);
    expect(under.amountToFreeShippingPaise).toBe(30000);
    expect(under.grandTotalPaise).toBe(77800);

    const free = calculateCartPricing({
      lines: [{ variantId: "v1", unitPricePaise: 69900, quantity: 2 }],
    });
    expect(free.shippingPaise).toBe(0);
    expect(free.amountToFreeShippingPaise).toBe(0);
    expect(free.grandTotalPaise).toBe(139800);
  });

  it("enforces percentage coupon maximum discount cap and minimum subtotal", () => {
    const coupon = {
      code: "WELCOME10",
      discountType: "PERCENTAGE" as const,
      discountValue: 10,
      minSubtotalPaise: 99900,
      maxDiscountPaise: 50000, // ₹500 cap
      usageLimit: 100,
      usedCount: 5,
      isActive: true,
      expiresAt: null,
    };

    const tooLow = calculateCartPricing({
      lines: [{ variantId: "v1", unitPricePaise: 59900, quantity: 1 }],
      coupon,
    });
    expect(tooLow.discountPaise).toBe(0);
    expect(tooLow.appliedCouponCode).toBeNull();
    expect(tooLow.couponRejectionReason).toMatch(/minimum subtotal/);

    const capped = calculateCartPricing({
      lines: [{ variantId: "v2", unitPricePaise: 349900, quantity: 2 }], // ₹6,998 -> 10% = ₹699.80, capped at ₹500
      coupon,
    });
    expect(capped.discountPaise).toBe(50000);
    expect(capped.appliedCouponCode).toBe("WELCOME10");
  });

  it("rejects expired or usage-exhausted coupons", () => {
    const expired = calculateCartPricing({
      lines: [{ variantId: "v1", unitPricePaise: 199900, quantity: 1 }],
      now: new Date("2026-11-11T00:00:00Z"),
      coupon: {
        code: "OLD20",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minSubtotalPaise: 0,
        maxDiscountPaise: null,
        usageLimit: 10,
        usedCount: 2,
        isActive: true,
        expiresAt: new Date("2026-10-01T00:00:00Z"),
      },
    });
    expect(expired.discountPaise).toBe(0);
    expect(expired.couponRejectionReason).toMatch(/expired/);
  });
});
