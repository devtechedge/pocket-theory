import type {
  CompatibilityItem,
  ComplianceStatus,
  ProductFaq,
  ProductStatus,
  ShippingClass,
  SpecVerificationNote,
} from "@/db/schema";

export interface SeedVariantInput {
  id: string;
  sku: string;
  label: string;
  colorHex: string;
  stock: number;
  priceOverridePaise?: number;
  mrpOverridePaise?: number;
  isDefault?: boolean;
}

export interface SeedSpecInput {
  specGroup: string;
  specKey: string;
  specValue: string;
  verificationNote: SpecVerificationNote;
}

export interface SeedProductInput {
  id: string;
  catalogIndex: number;
  sku: string;
  slug: string;
  categorySlug:
    | "power-charging"
    | "audio"
    | "wearables-smart"
    | "desk-creator"
    | "automotive-travel";
  title: string;
  subtitle: string;
  description: string;
  pricePaise: number;
  mrpPaise: number;
  hsnCode: string;
  gstRateBps: number;
  weightGrams: number;
  dimensionsMm: string;
  shippingClass: ShippingClass;
  genericName: string;
  modelNumber: string;
  requiresBisCrs: boolean;
  bisStandardRef: string | null;
  requiresWpcEta: boolean;
  batteryWhRating: string | null;
  warrantyMonths: number;
  returnWindowDays: number;
  safetyNotes: string;
  boxContents: string[];
  compatibility: CompatibilityItem[];
  faqs: ProductFaq[];
  specs: SeedSpecInput[];
  variants: SeedVariantInput[];
  isFeatured?: boolean;
  isNewDrop?: boolean;
  collectionSlugs: string[];
  accessorySlugs: string[];
  searchBoost?: number;
  complianceStatus?: ComplianceStatus;
  status?: ProductStatus;
}
