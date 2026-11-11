# Deployment & Operations Guide - POCKET THEORY

**Target Host:** Vercel (`framework: "nextjs"`, Node 22)  
**Primary Database:** Managed PostgreSQL (Neon Postgres / compatible PostgreSQL 15-17)

---

## 1. Environment Variables

Configure these in Vercel Project Settings -> Environment Variables (separately for **Production** and **Preview**):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes (Vercel) | Pooled PostgreSQL connection string (`-pooler` on Neon, `sslmode=require`). |
| `DATABASE_URL_UNPOOLED` | Recommended | Direct PostgreSQL connection string for running schema migrations (`scripts/migrate.ts`). |
| `SESSION_PEPPER` | Yes | >=32 random hex characters used to pepper SHA-256 session, cart, and IP rate-limit hashes. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Final public canonical HTTPS URL (current: `https://pocket-theory-nu.vercel.app`) for canonical tags, `sitemap.xml`, `robots.txt`, and JSON-LD. |
| `DEMO_MODE` | Yes | `"1"` for public non-charging demo deployment; `"0"` for live commercial enforcement. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional | Enables live INR Razorpay order creation & signature verification. When unset, checkout uses the clearly labelled Non-Charging Demo Sandbox. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Required for `/api/webhooks/razorpay` HMAC verification. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional | Optional Stripe INR PaymentIntent & webhook verification. |
| `EMAIL_FROM` / `EMAIL_PROVIDER_API_KEY` | Optional | Optional Resend HTTP delivery; otherwise emails persist to PostgreSQL `email_outbox`. |

---

## 2. Safe Schema-First Deployment Order

1. **Provision separate Production and Preview PostgreSQL databases** (`pocket_theory` for Production, `pocket_theory_preview` for Preview) so preview branch testing never mutates production records.
2. **Apply schema & demo seed before or alongside initial deploy** (never run migrations inside `vercel-build` where serverless builds can contend on advisory locks):
   ```bash
   DATABASE_URL_UNPOOLED="<prod-direct-url>" npm run db:migrate
   ALLOW_PROD_SEED=1 DATABASE_URL_UNPOOLED="<prod-direct-url>" npm run db:seed
   ```
   > **Safety guard:** `scripts/seed.ts` refuses to reset any database whose name does not include `test`, `e2e`, or `preview` unless `ALLOW_PROD_SEED=1` is explicitly passed. Never run `db:seed` against a live commercial database containing real customer orders.
3. **Verify project settings on Vercel:**
   - `framework`: `"nextjs"` (pinned in `vercel.json`)
   - `ssoProtection`: `null` (so public visitors do not hit a Vercel Authentication login wall)
   - `gitProviderOptions.createDeployments`: `"enabled"`, production branch `main`.
4. **Post-deploy live verification:**
   - Confirm `GET /api/health` returns `200 OK` with `{ "status": "ok", "dbDriver": "postgres", "activeSkus": 40 }`.
   - Confirm security headers, `/robots.txt`, `/sitemap.xml`, catalogue pages, PDP PIN check, and non-charging demo checkout on the live HTTPS alias.
