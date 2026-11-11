# Data Model & Transaction Invariants - POCKET THEORY

All monetary columns across PostgreSQL use **32-bit signed integers representing Indian paise (`1 INR = 100 paise`)**. Floating-point money does not exist anywhere in the schema or application code.

---

## 1. Core Relational Schema (`src/db/schema/`)

### 1.1 Catalog & Compliance (`catalog.ts`)
- **`categories`**: `id`, `slug` (unique), `name`, `shortLabel`, `description`, `sortOrder`, `heroTagline`, `isFeatured`, `createdAt`.
- **`products`**:
  - Identity: `id`, `catalogIndex` (`1..40`, unique), `sku` (unique, e.g. `PT-PWR-001`), `slug` (unique), `brand` (`POCKET THEORY`), `categoryId` (FK -> `categories.id`), `title`, `subtitle`, `description`.
  - Pricing (paise): `pricePaise` (`CHECK > 0`), `mrpPaise` (`CHECK >= pricePaise`), `hsnCode`, `gstRateBps` (e.g. `1800` = 18.00%).
  - Physical & Shipping: `weightGrams`, `dimensionsMm`, `shippingClass` (`STANDARD`, `LITHIUM_SURFACE`, `BULKY`), `boxContents` (`jsonb` string array), `compatibility` (`jsonb` array), `faqs` (`jsonb` array), `images` (`jsonb` typed gallery array).
  - Warranty & Returns: `warrantyMonths`, `warrantyTerms`, `returnWindowDays`, `returnEligible`, `returnExclusions`.
  - Compliance & Statutory (Legal Metrology / BIS / WPC / E-Waste): `genericName`, `modelNumber`, `netQuantity` (`1 N`), `countryOfOrigin`, `manufacturerDetails`, `importerDetails`, `customerCareContact`, `requiresBisCrs`, `bisStandardRef`, `bisRegistrationNumber`, `requiresWpcEta`, `wpcEtaNumber`, `batteryWhRating`, `safetyNotes`, `complianceStatus` (`DEMO_ILLUSTRATIVE` | `PENDING_REVIEW` | `VERIFIED` | `MISSING_EVIDENCE` | `REJECTED`).
  - Merchandising & Lifecycle: `status` (`DRAFT` | `ACTIVE` | `ARCHIVED`), `isFeatured`, `isNewDrop`, `collectionSlugs` (`jsonb`), `accessorySlugs` (`jsonb`), `searchBoost` (`integer`), `createdAt`, `updatedAt`.
- **`product_variants`**: `id`, `productId` (FK -> `products.id` CASCADE), `sku` (unique), `label` (e.g. `Graphite Ink`, `Warm Porcelain`, `Signal Tangerine`), `colorHex`, `priceOverridePaise` (nullable), `mrpOverridePaise` (nullable), `stock` (`integer NOT NULL CHECK (stock >= 0)`), `lowStockThreshold`, `isDefault`, `sortOrder`.
- **`product_specs`**: `id`, `productId` (FK -> `products.id` CASCADE), `specGroup`, `specKey`, `specValue`, `verificationNote` (`ILLUSTRATIVE_DEMO` | `PENDING_VERIFICATION` | `DESIGN_TARGET`), `sortOrder`.

### 1.2 Customers, Auth, Carts & Wishlists (`customers.ts`)
- **`users`**: `id`, `email` (unique, lowercased), `fullName`, `phone`, `passwordHash`, `role` (`CUSTOMER` | `SUPPORT_OPS` | `CATALOG_MANAGER` | `SUPER_ADMIN`), `isActive`, `createdAt`, `updatedAt`.
- **`sessions`**: `id`, `userId` (FK -> `users.id` CASCADE), `tokenHash` (unique SHA-256), `expiresAt`, `ipHash`, `userAgent`, `createdAt`.
- **`addresses`**: `id`, `userId` (FK -> `users.id` CASCADE), `label`, `recipientName`, `phone`, `line1`, `line2`, `landmark`, `city`, `stateName`, `stateCode` (2-digit GST state code), `pinCode` (6-digit), `isDefault`, `createdAt`.
- **`carts`**: `id`, `tokenHash` (unique), `userId` (nullable FK -> `users.id` SET NULL), `couponCode` (nullable), `updatedAt`, `createdAt`.
- **`cart_items`**: `id`, `cartId` (FK -> `carts.id` CASCADE), `productId` (FK -> `products.id`), `variantId` (FK -> `product_variants.id`), `quantity` (`CHECK (quantity > 0 AND quantity <= 10)`), unique `(cartId, variantId)`.
- **`wishlist_items`**: `id`, `userId` (nullable FK -> `users.id` CASCADE), `guestTokenHash` (nullable), `productId` (FK -> `products.id` CASCADE), `createdAt`.

### 1.3 Orders, Payments, Webhooks, Inventory Ledger & Returns (`commerce.ts`)
- **`orders`**:
  - `id`, `orderNumber` (unique, e.g. `PT-2026-10042`), `idempotencyKey` (unique), `userId` (nullable FK -> `users.id` SET NULL).
  - Contact & Shipping Snapshot: `customerEmail`, `customerName`, `customerPhone`, `buyerGstin` (nullable), `shippingAddressJson`, `shippingStateCode`, `shippingPinCode`, `shippingMethod` (`STANDARD` | `EXPRESS`).
  - Integer-Paise Totals: `subtotalPaise`, `discountPaise`, `couponCode`, `shippingPaise`, `taxableAmountPaise`, `cgstPaise`, `sgstPaise`, `igstPaise`, `totalTaxPaise`, `grandTotalPaise`.
  - Statuses: `status` (`PENDING_PAYMENT` | `DEMO_CONFIRMED` | `CONFIRMED` | `PACKED` | `SHIPPED` | `DELIVERED` | `CANCELLED` | `REFUNDED`), `paymentStatus` (`PENDING` | `DEMO_AUTHORIZED` | `AUTHORIZED` | `PAID` | `FAILED` | `REFUNDED`), `paymentProvider` (`DEMO_SANDBOX` | `RAZORPAY` | `STRIPE`), `isDemoOrder` (`boolean NOT NULL`).
  - Fulfilment: `carrierName` (nullable), `trackingNumber` (nullable), `shippedAt`, `deliveredAt`, `cancelledAt`, `cancelReason`, `createdAt`, `updatedAt`.
- **`order_items`** (immutable snapshot at purchase time):
  - `id`, `orderId` (FK -> `orders.id` CASCADE), `productId`, `variantId`, `productSlug`, `productTitle`, `sku`, `variantLabel`, `hsnCode`, `gstRateBps`, `quantity`, `unitPricePaise`, `lineTotalPaise`, `taxAmountPaise`, `warrantyMonths`, `returnWindowDays`.
- **`payments`**: `id`, `orderId` (FK -> `orders.id` CASCADE), `provider`, `providerOrderId`, `providerPaymentId`, `amountPaise`, `currency` (`INR`), `status`, `isDemo`, `signatureVerified`, `failureReason`, `rawMetaJson`, `createdAt`, `updatedAt`.
- **`webhook_events`**: `id`, `provider`, `eventId` (unique per provider), `eventType`, `signatureValid`, `processedAt`, `payloadSummaryJson`.
- **`inventory_movements`**: `id`, `variantId` (FK -> `product_variants.id`), `orderId` (nullable FK), `actorUserId` (nullable FK), `delta` (`integer NOT NULL`), `balanceAfter` (`integer NOT NULL`), `reason` (`INITIAL_SEED` | `ORDER_RESERVE` | `ORDER_CANCEL_RELEASE` | `PAYMENT_FAIL_RELEASE` | `RETURN_RESTOCK` | `ADMIN_RESTOCK` | `ADMIN_DAMAGE` | `ADMIN_AUDIT`), `note`, `createdAt`.
- **`return_requests`**: `id`, `orderId` (FK -> `orders.id`), `orderItemId` (FK -> `order_items.id`), `userId` (nullable FK), `reason`, `details`, `status` (`REQUESTED` | `APPROVED` | `REJECTED` | `RECEIVED` | `REFUNDED`), `resolutionNote`, `refundAmountPaise`, `createdAt`, `updatedAt`.

### 1.4 Promotions, Audit, Outbox & Operational Settings (`operations.ts`)
- **`coupons`**: `id`, `code` (unique uppercase), `description`, `discountType` (`PERCENTAGE` | `FIXED_PAISE`), `discountValue`, `minSubtotalPaise`, `maxDiscountPaise`, `usageLimit`, `usedCount`, `isActive`, `expiresAt`, `createdAt`.
- **`shipping_rules`**: `id`, `code` (unique), `label`, `freeThresholdPaise`, `baseFeePaise`, `estimatedDaysMin`, `estimatedDaysMax`, `isActive`.
- **`store_settings`**: `key` (PK), `valueJson`, `updatedBy`, `updatedAt`.
- **`audit_logs`**: `id`, `actorUserId`, `actorEmail`, `actorRole`, `action`, `entityType`, `entityId`, `summary`, `beforeJson`, `afterJson`, `ipHash`, `createdAt`.
- **`email_outbox`**: `id`, `toEmail`, `template`, `subject`, `textBody`, `htmlBody`, `relatedOrderNumber`, `deliveryMode` (`DEV_SINK` | `PROVIDER_SENT`), `createdAt`.
- **`newsletter_subscribers`**, **`contact_inquiries`**, **`rate_limit_buckets`**.

---

## 2. Concurrency & Integrity Invariants

1. **Zero-Oversell Reservation:** Inside `db.transaction()`, each line item executes an atomic conditional update:
   `UPDATE product_variants SET stock = stock - $qty WHERE id = $variantId AND stock >= $qty RETURNING stock`.
   If zero rows are returned for any line item, the entire transaction rolls back with `INSUFFICIENT_STOCK` and zero orphan order or ledger rows are persisted.
2. **Checkout Idempotency:** `orders.idempotency_key` carries a `UNIQUE` index. Retrying a checkout submission with the same idempotency key returns the existing order record rather than double-reserving stock or creating a duplicate order.
3. **Webhook Replay Immunity:** `webhook_events (provider, event_id)` carries a `UNIQUE` constraint. Replayed Razorpay or Stripe webhook deliveries return `200 OK { deduplicated: true }` without mutating payment or inventory state twice.
