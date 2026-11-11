import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sanitizeInternalPath } from "@/components/auth/LoginForm";
import { hasCapability } from "@/domains/auth/rbac";
import {
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
  verifyStripeWebhookSignature,
} from "@/domains/payments/adapters";
import { hashPasswordSync, verifyPasswordSync } from "@/lib/crypto-password";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { redactEmail, redactIndianPhone } from "@/lib/security/redact";

describe("Razorpay & Stripe cryptographic signature verification", () => {
  it("accepts valid Razorpay checkout & webhook HMAC signatures and rejects tampered ones", () => {
    const secret = "rzp_test_secret_998877";
    const orderId = "order_PTheory001";
    const paymentId = "pay_PTheory999";
    const validSig = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyRazorpayCheckoutSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSig,
        secret,
      }),
    ).toBe(true);

    const tampered =
      validSig.slice(0, -1) + (validSig.endsWith("a") ? "b" : "a");
    expect(
      verifyRazorpayCheckoutSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: tampered,
        secret,
      }),
    ).toBe(false);

    const rawWebhook = JSON.stringify({ event: "payment.captured" });
    const whSig = createHmac("sha256", secret).update(rawWebhook).digest("hex");
    expect(
      verifyRazorpayWebhookSignature({
        rawBody: rawWebhook,
        signatureHeader: whSig,
        webhookSecret: secret,
      }),
    ).toBe(true);
    expect(
      verifyRazorpayWebhookSignature({
        rawBody: rawWebhook + " ",
        signatureHeader: whSig,
        webhookSecret: secret,
      }),
    ).toBe(false);
  });

  it("verifies Stripe t=,v1= webhook signatures and blocks stale replay timestamps", () => {
    const whSecret = "whsec_stripe_unit_test";
    const body = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    const nowSec = 1_760_000_000;
    const v1 = createHmac("sha256", whSecret)
      .update(`${nowSec}.${body}`)
      .digest("hex");

    expect(
      verifyStripeWebhookSignature({
        rawBody: body,
        signatureHeader: `t=${nowSec},v1=${v1}`,
        webhookSecret: whSecret,
        nowEpochSeconds: nowSec + 60,
      }),
    ).toBe(true);

    // Replay outside 300s tolerance window must fail
    expect(
      verifyStripeWebhookSignature({
        rawBody: body,
        signatureHeader: `t=${nowSec},v1=${v1}`,
        webhookSecret: whSecret,
        nowEpochSeconds: nowSec + 900,
      }),
    ).toBe(false);
  });
});

describe("RBAC, CSRF, Password Scrypt, Redirects & PII Redaction", () => {
  it("enforces least-privilege capabilities per role", () => {
    expect(hasCapability("CUSTOMER", "VIEW_ADMIN_OVERVIEW")).toBe(false);
    expect(hasCapability("SUPPORT_OPS", "MANAGE_ORDERS_RETURNS")).toBe(true);
    expect(hasCapability("SUPPORT_OPS", "MANAGE_CATALOG")).toBe(false);
    expect(hasCapability("CATALOG_MANAGER", "MANAGE_CATALOG")).toBe(true);
    expect(
      hasCapability("CATALOG_MANAGER", "VIEW_UNREDACTED_CUSTOMER_CONTACT"),
    ).toBe(false);
    expect(hasCapability("SUPER_ADMIN", "MANAGE_USERS_AND_SETTINGS")).toBe(
      true,
    );
  });

  it("hashes and verifies scrypt passwords safely", () => {
    const h = hashPasswordSync("PocketTheory-Unit-Test!");
    expect(verifyPasswordSync("PocketTheory-Unit-Test!", h)).toBe(true);
    expect(verifyPasswordSync("Wrong-Password!", h)).toBe(false);
  });

  it("prevents open redirects on login next paths", () => {
    expect(sanitizeInternalPath("/admin/orders")).toBe("/admin/orders");
    expect(sanitizeInternalPath("https://evil.example/phish")).toBe("/account");
    expect(sanitizeInternalPath("//evil.example")).toBe("/account");
    expect(sanitizeInternalPath("/\\evil.example")).toBe("/account");
  });

  it("blocks cross-origin POST requests while permitting same-origin", () => {
    const okReq = new Request("https://pocket-theory.vercel.app/api/cart", {
      method: "POST",
      headers: {
        host: "pocket-theory.vercel.app",
        origin: "https://pocket-theory.vercel.app",
      },
    });
    expect(() => assertSameOrigin(okReq)).not.toThrow();

    const badReq = new Request("https://pocket-theory.vercel.app/api/cart", {
      method: "POST",
      headers: {
        host: "pocket-theory.vercel.app",
        origin: "https://attacker.example",
      },
    });
    expect(() => assertSameOrigin(badReq)).toThrow(CsrfOriginError);
  });

  it("redacts customer email and Indian phone numbers cleanly", () => {
    expect(redactEmail("aarav@pockettheory.demo")).toBe(
      "aa***@pockettheory.demo",
    );
    expect(redactIndianPhone("9820411209")).toBe("+91 ******1209");
  });
});
