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
import { products, productVariants } from "./catalog";
import { users } from "./customers";

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  stateName: string;
  stateCode: string;
  pinCode: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "DEMO_CONFIRMED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "DEMO_AUTHORIZED"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type PaymentProvider = "DEMO_SANDBOX" | "RAZORPAY" | "STRIPE";
export type ShippingMethod = "STANDARD" | "EXPRESS";

export type InventoryMovementReason =
  | "INITIAL_SEED"
  | "ORDER_RESERVE"
  | "ORDER_CANCEL_RELEASE"
  | "PAYMENT_FAIL_RELEASE"
  | "RETURN_RESTOCK"
  | "ADMIN_RESTOCK"
  | "ADMIN_DAMAGE"
  | "ADMIN_AUDIT";

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    buyerGstin: text("buyer_gstin"),
    shippingAddressJson: jsonb("shipping_address_json")
      .$type<ShippingAddressSnapshot>()
      .notNull(),
    shippingStateCode: text("shipping_state_code").notNull(),
    shippingPinCode: text("shipping_pin_code").notNull(),
    shippingMethod: text("shipping_method")
      .$type<ShippingMethod>()
      .notNull()
      .default("STANDARD"),

    // Integer-paise monetary snapshot
    subtotalPaise: integer("subtotal_paise").notNull(),
    discountPaise: integer("discount_paise").notNull().default(0),
    couponCode: text("coupon_code"),
    shippingPaise: integer("shipping_paise").notNull().default(0),
    taxableAmountPaise: integer("taxable_amount_paise").notNull(),
    cgstPaise: integer("cgst_paise").notNull().default(0),
    sgstPaise: integer("sgst_paise").notNull().default(0),
    igstPaise: integer("igst_paise").notNull().default(0),
    totalTaxPaise: integer("total_tax_paise").notNull(),
    grandTotalPaise: integer("grand_total_paise").notNull(),

    status: text("status")
      .$type<OrderStatus>()
      .notNull()
      .default("PENDING_PAYMENT"),
    paymentStatus: text("payment_status")
      .$type<PaymentStatus>()
      .notNull()
      .default("PENDING"),
    paymentProvider: text("payment_provider")
      .$type<PaymentProvider>()
      .notNull()
      .default("DEMO_SANDBOX"),
    isDemoOrder: boolean("is_demo_order").notNull().default(true),

    carrierName: text("carrier_name"),
    trackingNumber: text("tracking_number"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_order_number_uidx").on(table.orderNumber),
    uniqueIndex("orders_idempotency_key_uidx").on(table.idempotencyKey),
    index("orders_user_idx").on(table.userId),
    index("orders_email_idx").on(table.customerEmail),
    index("orders_status_idx").on(table.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productSlug: text("product_slug").notNull(),
    productTitle: text("product_title").notNull(),
    sku: text("sku").notNull(),
    variantLabel: text("variant_label").notNull(),
    imageUrl: text("image_url").notNull(),
    hsnCode: text("hsn_code").notNull(),
    gstRateBps: integer("gst_rate_bps").notNull(),
    quantity: integer("quantity").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
    taxAmountPaise: integer("tax_amount_paise").notNull(),
    warrantyMonths: integer("warranty_months").notNull(),
    returnWindowDays: integer("return_window_days").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").$type<PaymentProvider>().notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    amountPaise: integer("amount_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: text("status").$type<PaymentStatus>().notNull(),
    isDemo: boolean("is_demo").notNull().default(true),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    failureReason: text("failure_reason"),
    rawMetaJson: jsonb("raw_meta_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    index("payments_provider_order_idx").on(table.providerOrderId),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").$type<PaymentProvider>().notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    signatureValid: boolean("signature_valid").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    payloadSummaryJson: jsonb("payload_summary_json").$type<
      Record<string, unknown>
    >(),
  },
  (table) => [
    uniqueIndex("webhook_events_provider_event_uidx").on(
      table.provider,
      table.eventId,
    ),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: text("id").primaryKey(),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    delta: integer("delta").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason").$type<InventoryMovementReason>().notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("inventory_movements_variant_idx").on(table.variantId)],
);

export const returnRequests = pgTable(
  "return_requests",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: text("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reason: text("reason").notNull(),
    details: text("details").notNull(),
    status: text("status")
      .$type<ReturnStatus>()
      .notNull()
      .default("REQUESTED"),
    resolutionNote: text("resolution_note"),
    refundAmountPaise: integer("refund_amount_paise").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("return_requests_order_idx").on(table.orderId),
    index("return_requests_user_idx").on(table.userId),
  ],
);
