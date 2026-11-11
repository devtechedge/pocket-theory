import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export interface ProductImage {
  url: string;
  alt: string;
  kind: "front" | "detail" | "spec" | "gallery";
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface CompatibilityItem {
  deviceClass: string;
  status: "COMPATIBLE" | "PARTIAL" | "NOT_COMPATIBLE" | "PENDING_VERIFICATION";
  note: string;
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ComplianceStatus =
  | "DEMO_ILLUSTRATIVE"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "MISSING_EVIDENCE"
  | "REJECTED";
export type ShippingClass = "STANDARD" | "LITHIUM_SURFACE" | "BULKY";
export type SpecVerificationNote =
  | "ILLUSTRATIVE_DEMO"
  | "PENDING_VERIFICATION"
  | "DESIGN_TARGET"
  | "VERIFIED_LAB";

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortLabel: text("short_label").notNull(),
    description: text("description").notNull(),
    heroTagline: text("hero_tagline").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("categories_slug_uidx").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    catalogIndex: integer("catalog_index").notNull(),
    sku: text("sku").notNull(),
    slug: text("slug").notNull(),
    brand: text("brand").notNull().default("POCKET THEORY"),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    description: text("description").notNull(),
    pricePaise: integer("price_paise").notNull(),
    mrpPaise: integer("mrp_paise").notNull(),
    hsnCode: text("hsn_code").notNull(),
    gstRateBps: integer("gst_rate_bps").notNull().default(1800),
    weightGrams: integer("weight_grams"),
    dimensionsMm: text("dimensions_mm"),
    shippingClass: text("shipping_class")
      .$type<ShippingClass>()
      .notNull()
      .default("STANDARD"),
    boxContents: jsonb("box_contents")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    compatibility: jsonb("compatibility")
      .$type<CompatibilityItem[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    faqs: jsonb("faqs")
      .$type<ProductFaq[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    images: jsonb("images")
      .$type<ProductImage[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    warrantyMonths: integer("warranty_months").notNull().default(12),
    warrantyTerms: text("warranty_terms").notNull(),
    returnWindowDays: integer("return_window_days").notNull().default(7),
    returnEligible: boolean("return_eligible").notNull().default(true),
    returnExclusions: text("return_exclusions").notNull(),

    // Statutory Legal Metrology + Indian Electronics Compliance fields
    genericName: text("generic_name").notNull(),
    modelNumber: text("model_number").notNull(),
    netQuantity: text("net_quantity").notNull().default("1 N"),
    countryOfOrigin: text("country_of_origin").notNull(),
    manufacturerDetails: text("manufacturer_details").notNull(),
    importerDetails: text("importer_details").notNull(),
    customerCareContact: text("customer_care_contact").notNull(),
    requiresBisCrs: boolean("requires_bis_crs").notNull().default(false),
    bisStandardRef: text("bis_standard_ref"),
    bisRegistrationNumber: text("bis_registration_number"),
    requiresWpcEta: boolean("requires_wpc_eta").notNull().default(false),
    wpcEtaNumber: text("wpc_eta_number"),
    batteryWhRating: text("battery_wh_rating"),
    safetyNotes: text("safety_notes").notNull(),
    complianceStatus: text("compliance_status")
      .$type<ComplianceStatus>()
      .notNull()
      .default("PENDING_REVIEW"),

    // Merchandising & Lifecycle
    status: text("status")
      .$type<ProductStatus>()
      .notNull()
      .default("DRAFT"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNewDrop: boolean("is_new_drop").notNull().default(false),
    collectionSlugs: jsonb("collection_slugs")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    accessorySlugs: jsonb("accessory_slugs")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    searchBoost: integer("search_boost").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("products_sku_uidx").on(table.sku),
    uniqueIndex("products_slug_uidx").on(table.slug),
    uniqueIndex("products_catalog_index_uidx").on(table.catalogIndex),
    index("products_category_status_idx").on(table.categoryId, table.status),
    index("products_price_idx").on(table.pricePaise),
    check("products_price_positive_chk", sql`${table.pricePaise} > 0`),
    check(
      "products_mrp_gte_price_chk",
      sql`${table.mrpPaise} >= ${table.pricePaise}`,
    ),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    label: text("label").notNull(),
    colorHex: text("color_hex").notNull().default("#1B2028"),
    priceOverridePaise: integer("price_override_paise"),
    mrpOverridePaise: integer("mrp_override_paise"),
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("product_variants_sku_uidx").on(table.sku),
    index("product_variants_product_idx").on(table.productId),
    check("product_variants_stock_nonneg_chk", sql`${table.stock} >= 0`),
  ],
);

export const productSpecs = pgTable(
  "product_specs",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    specGroup: text("spec_group").notNull(),
    specKey: text("spec_key").notNull(),
    specValue: text("spec_value").notNull(),
    verificationNote: text("verification_note")
      .$type<SpecVerificationNote>()
      .notNull()
      .default("ILLUSTRATIVE_DEMO"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("product_specs_product_idx").on(table.productId)],
);
