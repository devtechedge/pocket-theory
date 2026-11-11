/**
 * All monetary amounts in POCKET THEORY are stored and manipulated strictly
 * as non-negative safe integers in Indian paise (1 INR = 100 paise).
 */

export const PAISE_PER_RUPEE = 100;
export const SUPPLIER_ORIGIN_STATE_CODE = "27"; // Maharashtra

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrDecimalFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function assertIntegerPaise(value: number, label = "amount"): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be an integer in paise, received: ${value}`);
  }
}

export function rupeesToPaise(rupees: number): number {
  const paise = Math.round(rupees * PAISE_PER_RUPEE);
  assertIntegerPaise(paise, "rupeesToPaise");
  return paise;
}

export function formatPaise(
  paise: number,
  options?: { alwaysShowPaise?: boolean },
): string {
  assertIntegerPaise(paise, "formatPaise");
  const rupees = paise / PAISE_PER_RUPEE;
  if (!options?.alwaysShowPaise && paise % PAISE_PER_RUPEE === 0) {
    return inrWholeFormatter.format(rupees);
  }
  return inrDecimalFormatter.format(rupees);
}

export function computeSavingsPercent(
  pricePaise: number,
  mrpPaise: number | null | undefined,
): number {
  assertIntegerPaise(pricePaise, "pricePaise");
  if (mrpPaise == null) return 0;
  assertIntegerPaise(mrpPaise, "mrpPaise");
  if (mrpPaise <= pricePaise || mrpPaise <= 0) return 0;
  return Math.round(((mrpPaise - pricePaise) * 100) / mrpPaise);
}

export interface GstBreakup {
  inclusiveTotalPaise: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  supplyType: "INTRA_STATE" | "INTER_STATE";
}

/**
 * Computes reverse GST breakup from a tax-inclusive B2C selling amount in paise.
 * Guarantees taxableValuePaise + cgstPaise + sgstPaise + igstPaise === inclusiveTotalPaise.
 */
export function computeInclusiveGstBreakup(
  inclusiveTotalPaise: number,
  gstRateBps: number,
  destinationStateCode: string,
  originStateCode: string = SUPPLIER_ORIGIN_STATE_CODE,
): GstBreakup {
  assertIntegerPaise(inclusiveTotalPaise, "inclusiveTotalPaise");
  assertIntegerPaise(gstRateBps, "gstRateBps");
  if (inclusiveTotalPaise < 0) {
    throw new Error("inclusiveTotalPaise cannot be negative");
  }
  if (gstRateBps < 0 || gstRateBps > 5000) {
    throw new Error(`Invalid gstRateBps: ${gstRateBps}`);
  }

  const taxableValuePaise = Math.round(
    (inclusiveTotalPaise * 10_000) / (10_000 + gstRateBps),
  );
  const totalTaxPaise = inclusiveTotalPaise - taxableValuePaise;
  const isIntraState =
    destinationStateCode.trim() === originStateCode.trim();

  if (isIntraState) {
    const cgstPaise = Math.floor(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    return {
      inclusiveTotalPaise,
      taxableValuePaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalTaxPaise,
      supplyType: "INTRA_STATE",
    };
  }

  return {
    inclusiveTotalPaise,
    taxableValuePaise,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: totalTaxPaise,
    totalTaxPaise,
    supplyType: "INTER_STATE",
  };
}
