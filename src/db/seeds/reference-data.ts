import type { UserRole } from "@/db/schema";

export const SEED_CATEGORIES = [
  {
    id: "cat-power",
    slug: "power-charging",
    name: "Power & Charging",
    shortLabel: "Power",
    description:
      "Portable lithium power banks, GaN wall bricks, magnetic stands, and E-Marked USB-C cables engineered for clean daily carry.",
    heroTagline: "Honest Wh ratings, clear PD port splits, zero tangled clutter.",
    sortOrder: 1,
    isFeatured: true,
  },
  {
    id: "cat-audio",
    slug: "audio",
    name: "Audio",
    shortLabel: "Audio",
    description:
      "ANC true wireless buds, open-ear sport hooks, tactile neckbands, over-ear studio cans, USB-C wired DAC earphones, and compact speakers.",
    heroTagline: "Balanced acoustics and clear voice pickup for Indian streets and desks.",
    sortOrder: 2,
    isFeatured: true,
  },
  {
    id: "cat-wearables",
    slug: "wearables-smart",
    name: "Wearables & Smart Devices",
    shortLabel: "Wearables",
    description:
      "AMOLED Bluetooth-calling wristwatches, featherweight activity bands, and replaceable-cell BLE item locators.",
    heroTagline: "Legible dials, standard straps, and upfront OS compatibility.",
    sortOrder: 3,
    isFeatured: true,
  },
  {
    id: "cat-desk",
    slug: "desk-creator",
    name: "Desk, Computer & Creator Gear",
    shortLabel: "Desk & Creator",
    description:
      "8-in-1 aluminium hubs, laptop risers, silent mice, 75% mechanical boards, cordless air dusters, handheld vacuums, tripods, wireless mics, and ring lights.",
    heroTagline: "Tactile aluminium and polycarbonate tools for focused workspaces.",
    sortOrder: 4,
    isFeatured: true,
  },
  {
    id: "cat-auto",
    slug: "automotive-travel",
    name: "Automotive & Travel",
    shortLabel: "Auto & Travel",
    description:
      "Flush 45W car chargers, supercapacitor dual-channel dashcams for Indian cabin heat, digital PSI tyre inflators, BT-FM receivers, and modular travel kits.",
    heroTagline: "Heat-aware cabin gear and compact transit organizers.",
    sortOrder: 5,
    isFeatured: true,
  },
] as const;

export const SEED_COUPONS = [
  {
    id: "cpn-welcome10",
    code: "WELCOME10",
    description: "10% off orders of ₹999 or above (capped at ₹500).",
    discountType: "PERCENTAGE" as const,
    discountValue: 10,
    minSubtotalPaise: 99900,
    maxDiscountPaise: 50000,
    usageLimit: 1000,
    usedCount: 1,
    isActive: true,
  },
  {
    id: "cpn-desk15",
    code: "DESK15",
    description: "15% off workspace & multi-device orders of ₹2,999 or above (capped at ₹900).",
    discountType: "PERCENTAGE" as const,
    discountValue: 15,
    minSubtotalPaise: 299900,
    maxDiscountPaise: 90000,
    usageLimit: 500,
    usedCount: 0,
    isActive: true,
  },
  {
    id: "cpn-flat150",
    code: "POCKET150",
    description: "Flat ₹150 off orders of ₹1,499 or above.",
    discountType: "FIXED_PAISE" as const,
    discountValue: 15000,
    minSubtotalPaise: 149900,
    maxDiscountPaise: 15000,
    usageLimit: 500,
    usedCount: 0,
    isActive: true,
  },
] as const;

export const SEED_SHIPPING_RULES = [
  {
    id: "ship-standard",
    code: "STANDARD",
    label: "Standard Insured Ground/Air Dispatch",
    freeThresholdPaise: 99900,
    baseFeePaise: 7900,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    isActive: true,
  },
  {
    id: "ship-express",
    code: "EXPRESS",
    label: "Priority Metro & Tier-1 Dispatch",
    freeThresholdPaise: 499900,
    baseFeePaise: 14900,
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
    isActive: true,
  },
] as const;

export const DEMO_ACCOUNT_PASSWORD = "PocketTheory-Demo-2026!";

export const SEED_DEMO_USERS: ReadonlyArray<{
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  saltHex: string;
}> = [
  {
    id: "usr-demo-customer",
    email: "customer@pockettheory.demo",
    fullName: "Aarav Kulkarni",
    phone: "9820411209",
    role: "CUSTOMER",
    saltHex: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  },
  {
    id: "usr-demo-support",
    email: "support@pockettheory.demo",
    fullName: "Meera Deshmukh",
    phone: "9820411210",
    role: "SUPPORT_OPS",
    saltHex: "b1b2c3d4e5f60718293a4b5c6d7e8f91",
  },
  {
    id: "usr-demo-catalog",
    email: "catalog@pockettheory.demo",
    fullName: "Rohan Nair",
    phone: "9820411211",
    role: "CATALOG_MANAGER",
    saltHex: "c1b2c3d4e5f60718293a4b5c6d7e8f92",
  },
  {
    id: "usr-demo-admin",
    email: "admin@pockettheory.demo",
    fullName: "Nandini Joshi",
    phone: "9820411212",
    role: "SUPER_ADMIN",
    saltHex: "d1b2c3d4e5f60718293a4b5c6d7e8f93",
  },
];

export const DEFAULT_CUSTOMER_CARE_CONTACT =
  "Consumer Care & Grievance Desk, Pocket Theory Consumer Devices (Demo Entity), Lower Parel, Mumbai, Maharashtra 400013 | Email: support@pockettheory.example | Tel: +91-22-4090-0100 (Mon-Sat, 10:00-18:00 IST)";

export const DEFAULT_MANUFACTURER_PLACEHOLDER =
  "Pending verified OEM/contract-manufacturer box declaration (Illustrative Demo Record)";

export const DEFAULT_IMPORTER_PLACEHOLDER =
  "Pocket Theory Consumer Devices, Lower Parel, Mumbai, MH 400013 (Illustrative Demo Record - verify before commercial sale)";
