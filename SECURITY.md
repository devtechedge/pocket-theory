# Security Policy & Threat Model - POCKET THEORY

**Scope:** `devtechedge/pocket-theory` (`POCKET THEORY` D2C personal electronics application).

---

## 1. Authentication, Sessions & Password Storage

- **Password Hashing:** All user passwords are hashed server-side via Node `crypto.scryptSync` with per-account 16-byte random salts (`scrypt$<saltHex>$<derivedHex>`) and compared using `crypto.timingSafeEqual`. No plaintext passwords or unsalted digests are stored.
- **Session Tokens:** Sessions are stored in PostgreSQL (`sessions` table) indexed by `SHA-256(SESSION_PEPPER + ":" + rawToken)`. Raw opaque 256-bit tokens live only inside `HttpOnly; SameSite=Lax; Secure (production)` cookies (`pt_session`).
- **Demo Environment Residual Risk (`DEMO_MODE=1`):** When `DEMO_MODE=1` is enabled for public evaluation, `/login` intentionally exposes quick-fill buttons for four synthetic `.demo` accounts (`customer`, `support`, `catalog`, `admin` at `pockettheory.demo`). Setting `DEMO_MODE=0` disables demo quick-fill, requires a non-default `SESSION_PEPPER` on boot, and blocks `DEMO_ILLUSTRATIVE` SKUs from public sale.

---

## 2. Authorization (RBAC) & IDOR Prevention

- **Server-Enforced Capabilities:** Every `/admin/*` RSC page calls `requirePageCapability()` and every `/api/admin/*` route calls `requireApiCapability()` before executing queries or mutations (`SUPPORT_OPS`, `CATALOG_MANAGER`, `SUPER_ADMIN`).
- **Customer Ownership Isolation:** Customer order view (`/account/orders/[id]`), cancellation (`/api/orders/[id]/cancel`), return submission (`/api/orders/[id]/return`), reorder (`/api/orders/[id]/reorder`), and address deletion (`/api/account/addresses`) filter strictly on `userId === sessionUser.id`, returning `404` on cross-account IDs.
- **Least-Privilege PII Redaction:** Inside `/admin/customers`, `CATALOG_MANAGER` staff receive masked email (`aa***@domain`) and masked mobile (`+91 ******1209`) strings; unredacted support contact details require `SUPPORT_OPS` or `SUPER_ADMIN`.
- **Immutable Audit Trail:** Every privileged admin mutation (product create/edit, compliance gate block, inventory adjustment, order fulfilment/cancel, return resolution, coupon create/toggle, role change, checkout pause switch) appends a row to `audit_logs`.

---

## 3. Checkout, Price Integrity, Webhooks & CSRF

- **Zero Client Price Trust:** Checkout accepts only `{ variantId, quantity }`, `shippingMethod`, and `couponCode`; unit prices, promo rules, shipping fees, and 18% GST splits are loaded and computed exclusively in integer paise inside a PostgreSQL transaction.
- **Zero-Oversell Atomic Stock Lock:** Inventory reservation executes `UPDATE product_variants SET stock = stock - qty WHERE id = $variantId AND stock >= qty` inside `db.transaction()`. Concurrent requests exceeding remaining stock fail cleanly without negative balances.
- **Webhook Authenticity & Replay Immunity:**
  - `/api/webhooks/razorpay` verifies `x-razorpay-signature` via `HMAC-SHA256` (`timingSafeEqual`) and deduplicates event IDs in `webhook_events (provider, event_id)`.
  - `/api/webhooks/stripe` verifies `Stripe-Signature` (`t=...,v1=...`) within a 300-second replay window and deduplicates event IDs in `webhook_events`.
  - Non-charging demo completions (`/api/payments/demo-complete`) are rejected if `order.isDemoOrder` is `false` and never set `paymentStatus = 'PAID'`.
- **CSRF & Open Redirects:** Mutating browser `/api/*` routes enforce `Origin` / `Referer` host parity (`assertSameOrigin`). Post-login `next` paths pass through `sanitizeInternalPath()`, rejecting external origins, protocol-relative `//` URLs, and backslash bypasses.
- **HTTP Headers:** Configured in `next.config.ts`: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, and production `Strict-Transport-Security`.

---

## 4. Dependency Posture

- `npm audit --omit=dev` reports **0 vulnerabilities** as of 11 Nov 2026.
- The GitHub Actions pipeline blocks high-severity production advisories (`--audit-level=high`) on every merge to `main`.

## 5. Reporting a Vulnerability

Please report security issues privately via GitHub Security Advisories on `devtechedge/pocket-theory` rather than opening a public issue with exploit details.
