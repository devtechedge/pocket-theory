# Testing & Quality Gates - POCKET THEORY

All automated checks run locally and in GitHub Actions CI (`.github/workflows/ci.yml`) on Node 22 + PostgreSQL 17.

---

## 1. Commands

```bash
npm run lint               # ESLint 9 + eslint-config-next 16 (zero warnings/errors)
npm run typecheck          # next typegen + strict tsc --noEmit
npm run test:unit          # Vitest unit suite (21 tests across 3 files)
npm run test:integration   # Vitest PostgreSQL integration suite (5 stateful/concurrency tests)
npm run build              # Next.js 16.4.5 production build
npm run e2e                # Playwright Chromium E2E + Axe WCAG 2.2 AA against production server
```

---

## 2. Coverage Matrix

| Layer | File | Verified Scenarios |
| --- | --- | --- |
| **Unit - Money, Promos & GST** | `tests/unit/pricing-and-gst.test.ts` | Integer-paise formatting, float rejection, Maharashtra `27` CGST+SGST exact paisa parity, inter-state 18% IGST, ₹999 free-shipping threshold, coupon `%` max-discount cap, min-subtotal & expiry rejection. |
| **Unit - Compliance Gate & PIN** | `tests/unit/compliance-and-pin.test.ts` | `DEMO_ILLUSTRATIVE` vs `VERIFIED` publication rules, BIS CRS & WPC ETA commercial mode blocks, prohibited superlative scanner (`military-grade`, `waterproof`, `fastest`, `AI-powered`, fake `R-` numbers), 6-digit Indian PIN routing + Andaman (`744101`) lithium air-lift block. |
| **Unit - Crypto, RBAC & CSRF** | `tests/unit/security-webhooks-rbac.test.ts` | Razorpay Checkout & Webhook HMAC-SHA256 verification + single-char tamper failure, Stripe `t=,v1=` signature + stale timestamp replay block, `scrypt` password verify, RBAC matrix, open-redirect sanitizer, CSRF `Origin` guard, PII redaction. |
| **Integration - PostgreSQL** | `tests/integration/commerce-postgres.test.ts` | Exact 40 active seed SKUs, duplicate `idempotencyKey` deduplication, **10-way concurrent checkout race for 3 remaining units** (proves 3 succeed, 7 throw `InsufficientStockError`, final stock = `0`), `DEMO_CONFIRMED` vs `FAILED` stock restoration, `DRAFT` SKU checkout block. |
| **E2E - Storefront & Axe** | `tests/e2e/storefront-checkout.spec.ts` | `/api/health` (`activeSkus: 40`), CSP & security headers, `robots.txt` & `sitemap.xml`, keyboard skip-link focus, light/dark toggle, `@axe-core/playwright` WCAG 2.2 AA (`0` serious/critical violations on Home, `/compare`, PDP), full customer login -> search -> filter -> compare -> PIN check -> cart -> `WELCOME10` -> multi-step checkout -> demo order -> account order -> return submission. |
| **E2E - Admin & Viewports** | `tests/e2e/admin-and-responsive.spec.ts` | Unauthenticated & `CUSTOMER` `/admin` denial, Super Admin product edit + live Compliance Gate rejection (`military-grade`) + clean save, inventory stock `+5` ledger update, order fulfilment (`SHIPPED` + tracking), zero horizontal overflow (`scrollWidth <= innerWidth`) & zero broken images across **360px, 390px, 768px, and 1440px**, mobile drawer navigation. |
