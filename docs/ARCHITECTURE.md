# Architecture Overview - POCKET THEORY

**Brand:** POCKET THEORY (`"Useful tech. Zero fuss."`)  
**Market:** India (`INR` stored as integer paise, `Asia/Kolkata`)  
**Architecture style:** Modular Monolith on Next.js 16 App Router + PostgreSQL + Drizzle ORM

---

## 1. Domain Boundaries

All business rules live inside server-only domain modules under `src/domains/`, never inside React client components or raw route handlers:

| Domain | Path | Responsibilities |
| --- | --- | --- |
| **Catalog & Merchandising** | `src/domains/catalog/` | Category/collection queries, attribute filtering, search suggestions, related items, rule-based accessory cross-sells, URL-synced pagination, public visibility filtering. |
| **Compliance Gate** | `src/domains/compliance/` | Statutory Legal Metrology completeness check, BIS CRS / WPC ETA requirement enforcement, prohibited superlative/claim scanner (`military-grade`, `waterproof`, `AI-powered`, fake R-numbers), demo vs live publication gating. |
| **Pricing & GST** | `src/domains/pricing/` | Integer-paise cart subtotal, promo/coupon validation and discount caps, free-shipping threshold (`INR 999`), Standard/Express shipping fees, reverse-calculated GST inclusive split (`9% CGST + 9% SGST` intra-state MH vs `18% IGST` inter-state). |
| **Shipping & PIN Service** | `src/domains/shipping/` | Indian 6-digit PIN code validation (`^[1-9][0-9]{5}$`), postal-circle state lookup, dispatch/transit window estimation, lithium battery surface-routing notes. |
| **Cart & Wishlist** | `src/domains/cart/`, `src/domains/wishlist/` | Persistent PostgreSQL-backed guest and authenticated carts (`pt_cart` HttpOnly token), stock clamping, coupon attachment, guest-to-account merge on login, saved wishlist items. |
| **Auth & RBAC** | `src/domains/auth/` | `crypto.scrypt` password hashing with per-user salt, SHA-256 hashed session tokens in `sessions` table, `HttpOnly; SameSite=Lax; Secure` cookies, role enforcement (`CUSTOMER`, `SUPPORT_OPS`, `CATALOG_MANAGER`, `SUPER_ADMIN`). |
| **Orders & Inventory** | `src/domains/orders/` | Idempotent checkout transaction, conditional atomic stock reservation (`stock >= qty`), immutable order-item product/price/tax/warranty snapshots, inventory ledger movements, cancellation stock release, RMA return requests, one-click reorder. |
| **Payments & Webhooks** | `src/domains/payments/` | Pluggable adapter contract: **Razorpay** (primary India gateway, HMAC-SHA256 order/payment & webhook signature verification), **Stripe** (optional INR adapter with `t=,v1=` HMAC verification), and **Non-Charging Demo Sandbox** (default when live keys are absent; explicitly marks orders `DEMO_CONFIRMED` and never `PAID`). |
| **Notifications** | `src/domains/notifications/` | Pluggable email sink writing full HTML + plain-text transactional messages (`ORDER_CONFIRMED`, `ORDER_SHIPPED`, `ORDER_CANCELLED`, `RETURN_UPDATED`, `PASSWORD_RESET`) to PostgreSQL `email_outbox` (or external HTTP provider when configured). |
| **Administration & Audit** | `src/domains/admin/` | Real-time PostgreSQL revenue/AOV/category analytics, PII-redacted customer lookup, RBAC-checked product/inventory/order/coupon/user mutations, append-only `audit_logs`. |
| **Editorial Content** | `src/domains/content/` | Six sourced technical buying guides (Power bank capacity & Wh, USB-C PD & GaN, ANC vs ENC, Earbuds fit, Dashcams in Indian heat, Mini vacuums & tyre inflators) and statutory consumer policies. |

---

## 2. Database & Runtime Modes

1. **Primary Source of Truth (PostgreSQL via `pg` + `drizzle-orm/node-postgres`):**
   - Used in **Vercel Production**, **Vercel Preview**, **GitHub Actions CI (`postgres:17`)**, and local Postgres development via `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct migrations).
2. **Zero-Config Local Clone Fallback (`@electric-sql/pglite`):**
   - When `DATABASE_URL` is unset in local development (`PGLITE_FALLBACK=1`), `src/db/client.ts` boots an embedded PostgreSQL instance, applies the exact same generated SQL schema (`drizzle/0000_pocket_theory_init.sql`), and seeds the 40 demo SKUs deterministically so `npm install && npm run dev` works immediately after `git clone`.
   - `/api/health` honestly reports `{ status: "ok", dbDriver: "postgres" | "pglite", demoMode: boolean, activeProductCount: number }` without leaking connection hostnames or database names.

---

## 3. Security Architecture

- **Strict Server-Side Totals:** The client never submits prices, discounts, tax rates, or shipping fees at checkout; the server loads variant prices, coupons, and shipping rules from PostgreSQL inside the checkout transaction.
- **CSRF & Origin Protection:** Every mutating `/api/*` endpoint (except signature-verified `/api/webhooks/*`) validates `Origin` / `Referer` host parity via `assertSameOrigin()`.
- **Database-Backed Rate Limiting:** Login, registration, password reset, guest order lookup, coupon probes, checkout, newsletter, and contact endpoints enforce sliding-window rate limits stored in `rate_limit_buckets`.
- **PII Minimization & Redaction:** Admin customer listings mask email addresses and mobile numbers by default for non-support roles; structured error responses omit stack traces and secrets; card/UPI instruments never touch POCKET THEORY servers.
- **HTTP Security Headers:** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, and production `Strict-Transport-Security`.
