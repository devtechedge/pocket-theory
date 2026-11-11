import type { ShippingClass } from "@/db/schema";

export interface IndianStateOption {
  code: string;
  name: string;
}

export const INDIAN_STATES_AND_UTS: readonly IndianStateOption[] = [
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "04", name: "Chandigarh" },
  { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "07", name: "Delhi" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "38", name: "Ladakh" },
  { code: "31", name: "Lakshadweep" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "34", name: "Puducherry" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
];

export interface PinEstimateResult {
  valid: boolean;
  serviceable: boolean;
  pinCode: string;
  postalRegion: string;
  stateCode: string;
  zoneType: "ORIGIN_METRO" | "METRO_TIER1" | "TIER2_REGIONAL" | "REMOTE_CIRCLE";
  minBusinessDays: number;
  maxBusinessDays: number;
  routingMode: "AIR_OR_SURFACE" | "SURFACE_MANDATORY_LITHIUM";
  note: string;
}

const METRO_PREFIX_3 = new Set([
  "110", // New Delhi
  "122", // Gurugram
  "201", // Noida / Ghaziabad
  "400", // Mumbai / Navi Mumbai
  "411", // Pune
  "500", // Hyderabad
  "560", // Bengaluru
  "600", // Chennai
  "700", // Kolkata
  "380", // Ahmedabad
]);

function resolvePostalCircle(pin: string): {
  region: string;
  stateCode: string;
  remote?: boolean;
} {
  const p2 = Number.parseInt(pin.slice(0, 2), 10);
  const p3 = pin.slice(0, 3);

  if (p3 === "744") {
    return {
      region: "Andaman & Nicobar Islands",
      stateCode: "35",
      remote: true,
    };
  }
  if (p3 === "682") {
    return { region: "Kochi / Lakshadweep Circle", stateCode: "32" };
  }
  if (p2 === 11) return { region: "Delhi NCR", stateCode: "07" };
  if (p2 >= 12 && p2 <= 13) return { region: "Haryana", stateCode: "06" };
  if (p2 >= 14 && p2 <= 16) return { region: "Punjab / Chandigarh", stateCode: "03" };
  if (p2 === 17) return { region: "Himachal Pradesh", stateCode: "02", remote: true };
  if (p2 >= 18 && p2 <= 19)
    return { region: "Jammu, Kashmir & Ladakh", stateCode: "01", remote: true };
  if (p2 >= 20 && p2 <= 28)
    return { region: "Uttar Pradesh & Uttarakhand", stateCode: "09" };
  if (p2 >= 30 && p2 <= 34) return { region: "Rajasthan", stateCode: "08" };
  if (p2 >= 36 && p2 <= 39) return { region: "Gujarat", stateCode: "24" };
  if (p2 >= 40 && p2 <= 44) return { region: "Maharashtra & Goa", stateCode: "27" };
  if (p2 >= 45 && p2 <= 48) return { region: "Madhya Pradesh", stateCode: "23" };
  if (p2 === 49) return { region: "Chhattisgarh", stateCode: "22" };
  if (p2 >= 50 && p2 <= 50) return { region: "Telangana", stateCode: "36" };
  if (p2 >= 51 && p2 <= 53) return { region: "Andhra Pradesh", stateCode: "37" };
  if (p2 >= 56 && p2 <= 59) return { region: "Karnataka", stateCode: "29" };
  if (p2 >= 60 && p2 <= 64) return { region: "Tamil Nadu & Puducherry", stateCode: "33" };
  if (p2 >= 67 && p2 <= 69) return { region: "Kerala", stateCode: "32" };
  if (p2 >= 70 && p2 <= 74) return { region: "West Bengal & Sikkim", stateCode: "19" };
  if (p2 >= 75 && p2 <= 77) return { region: "Odisha", stateCode: "21" };
  if (p2 === 78) return { region: "Assam", stateCode: "18", remote: true };
  if (p2 === 79)
    return { region: "North-Eastern Postal Circle", stateCode: "17", remote: true };
  if (p2 >= 80 && p2 <= 85) return { region: "Bihar & Jharkhand", stateCode: "10" };

  return { region: "India Postal Network", stateCode: "27" };
}

export function isValidIndianPin(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

export function estimatePinDelivery(
  rawPin: string,
  shippingClass: ShippingClass = "STANDARD",
): PinEstimateResult {
  const pinCode = rawPin.trim();
  if (!isValidIndianPin(pinCode)) {
    return {
      valid: false,
      serviceable: false,
      pinCode,
      postalRegion: "Invalid PIN",
      stateCode: "27",
      zoneType: "TIER2_REGIONAL",
      minBusinessDays: 0,
      maxBusinessDays: 0,
      routingMode: "AIR_OR_SURFACE",
      note: "Enter a valid 6-digit Indian PIN code (cannot start with 0).",
    };
  }

  const circle = resolvePostalCircle(pinCode);
  const p3 = pinCode.slice(0, 3);
  const isLithium = shippingClass === "LITHIUM_SURFACE";

  // Island air-only PINs cannot receive high-Wh surface-only lithium packs
  if (p3 === "744" && isLithium) {
    return {
      valid: true,
      serviceable: false,
      pinCode,
      postalRegion: circle.region,
      stateCode: circle.stateCode,
      zoneType: "REMOTE_CIRCLE",
      minBusinessDays: 0,
      maxBusinessDays: 0,
      routingMode: "SURFACE_MANDATORY_LITHIUM",
      note: "Lithium battery packs require ground surface transport and cannot be air-lifted to island PIN codes.",
    };
  }

  let zoneType: PinEstimateResult["zoneType"] = "TIER2_REGIONAL";
  let minDays = 3;
  let maxDays = 5;

  if (p3 === "400" || p3 === "411") {
    zoneType = "ORIGIN_METRO";
    minDays = 1;
    maxDays = 2;
  } else if (METRO_PREFIX_3.has(p3)) {
    zoneType = "METRO_TIER1";
    minDays = isLithium ? 3 : 2;
    maxDays = isLithium ? 5 : 3;
  } else if (circle.remote) {
    zoneType = "REMOTE_CIRCLE";
    minDays = isLithium ? 6 : 5;
    maxDays = isLithium ? 9 : 7;
  } else {
    zoneType = "TIER2_REGIONAL";
    minDays = isLithium ? 4 : 3;
    maxDays = isLithium ? 6 : 5;
  }

  const note = isLithium
    ? `Dispatched from Mumbai warehouse via DGCA-compliant ground surface linehaul (${minDays}-${maxDays} business days estimate; illustrative schedule, no live carrier API bound).`
    : `Dispatched from Mumbai warehouse within 24h (${minDays}-${maxDays} business days estimate; free standard shipping on orders ₹999+).`;

  return {
    valid: true,
    serviceable: true,
    pinCode,
    postalRegion: circle.region,
    stateCode: circle.stateCode,
    zoneType,
    minBusinessDays: minDays,
    maxBusinessDays: maxDays,
    routingMode: isLithium ? "SURFACE_MANDATORY_LITHIUM" : "AIR_OR_SURFACE",
    note,
  };
}
