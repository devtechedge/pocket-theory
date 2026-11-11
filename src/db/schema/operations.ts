import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./customers";

export type DiscountType = "PERCENTAGE" | "FIXED_PAISE";

export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    description: text("description").notNull(),
    discountType: text("discount_type").$type<DiscountType>().notNull(),
    discountValue: integer("discount_value").notNull(),
    minSubtotalPaise: integer("min_subtotal_paise").notNull().default(0),
    maxDiscountPaise: integer("max_discount_paise"),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("coupons_code_uidx").on(table.code)],
);

export const shippingRules = pgTable(
  "shipping_rules",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    freeThresholdPaise: integer("free_threshold_paise").notNull(),
    baseFeePaise: integer("base_fee_paise").notNull(),
    estimatedDaysMin: integer("estimated_days_min").notNull(),
    estimatedDaysMax: integer("estimated_days_max").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("shipping_rules_code_uidx").on(table.code)],
);

export const storeSettings = pgTable("store_settings", {
  key: text("key").primaryKey(),
  valueJson: jsonb("value_json").$type<Record<string, unknown>>().notNull(),
  updatedBy: text("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email").notNull(),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    summary: text("summary").notNull(),
    beforeJson: jsonb("before_json").$type<Record<string, unknown> | null>(),
    afterJson: jsonb("after_json").$type<Record<string, unknown> | null>(),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: text("id").primaryKey(),
    toEmail: text("to_email").notNull(),
    template: text("template").notNull(),
    subject: text("subject").notNull(),
    textBody: text("text_body").notNull(),
    htmlBody: text("html_body").notNull(),
    relatedOrderNumber: text("related_order_number"),
    deliveryMode: text("delivery_mode")
      .$type<"DEV_SINK" | "PROVIDER_SENT">()
      .notNull()
      .default("DEV_SINK"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("email_outbox_created_idx").on(table.createdAt)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    source: text("source").notNull().default("footer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("newsletter_email_uidx").on(table.email)],
);

export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    topic: text("topic").notNull(),
    orderNumber: text("order_number"),
    message: text("message").notNull(),
    status: text("status")
      .$type<"OPEN" | "ACKNOWLEDGED" | "RESOLVED">()
      .notNull()
      .default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contact_inquiries_created_idx").on(table.createdAt)],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    bucketKey: text("bucket_key").primaryKey(),
    hits: integer("hits").notNull().default(1),
    windowEndsAt: timestamp("window_ends_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [index("rate_limit_window_idx").on(table.windowEndsAt)],
);
