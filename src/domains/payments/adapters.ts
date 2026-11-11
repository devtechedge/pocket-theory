import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "@/db/schema";
import { getEnv, hasLiveRazorpay, hasLiveStripe } from "@/env";

export interface PaymentIntentInitResult {
  provider: PaymentProvider;
  isDemo: boolean;
  providerOrderId: string;
  razorpayKeyId?: string;
  stripeClientSecret?: string;
  amountPaise: number;
  currency: "INR";
}

function safeHexEqual(expectedHex: string, receivedHex: string): boolean {
  const cleanExpected = expectedHex.trim().toLowerCase();
  const cleanReceived = receivedHex.trim().toLowerCase();
  if (
    cleanExpected.length === 0 ||
    cleanExpected.length !== cleanReceived.length ||
    !/^[0-9a-f]+$/.test(cleanExpected) ||
    !/^[0-9a-f]+$/.test(cleanReceived)
  ) {
    return false;
  }
  const a = Buffer.from(cleanExpected, "hex");
  const b = Buffer.from(cleanReceived, "hex");
  return timingSafeEqual(a, b);
}

/**
 * Verifies Razorpay Checkout client callback signature:
 * HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 */
export function verifyRazorpayCheckoutSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}): boolean {
  if (!params.secret.trim()) return false;
  const payload = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const digest = createHmac("sha256", params.secret)
    .update(payload)
    .digest("hex");
  return safeHexEqual(digest, params.razorpaySignature);
}

/**
 * Verifies Razorpay Webhook signature (`x-razorpay-signature`) over raw body.
 */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
}): boolean {
  if (!params.webhookSecret.trim() || !params.signatureHeader.trim()) {
    return false;
  }
  const digest = createHmac("sha256", params.webhookSecret)
    .update(params.rawBody)
    .digest("hex");
  return safeHexEqual(digest, params.signatureHeader);
}

/**
 * Verifies Stripe `Stripe-Signature` header (`t=timestamp,v1=hex`) with replay window check.
 */
export function verifyStripeWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
  toleranceSeconds?: number;
  nowEpochSeconds?: number;
}): boolean {
  if (!params.webhookSecret.trim() || !params.signatureHeader.trim()) {
    return false;
  }
  const parts = params.signatureHeader.split(",").map((s) => s.trim());
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));

  if (!timestampPart || v1Parts.length === 0) return false;
  const timestamp = Number.parseInt(timestampPart.slice(2), 10);
  if (!Number.isFinite(timestamp)) return false;

  const nowSec = params.nowEpochSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = params.toleranceSeconds ?? 300;
  if (Math.abs(nowSec - timestamp) > tolerance) {
    return false;
  }

  const signedPayload = `${timestamp}.${params.rawBody}`;
  const expected = createHmac("sha256", params.webhookSecret)
    .update(signedPayload)
    .digest("hex");

  return v1Parts.some((candidate) => safeHexEqual(expected, candidate));
}

export function getActivePaymentCapabilities() {
  const razorpayConfigured = hasLiveRazorpay();
  const stripeConfigured = hasLiveStripe();
  return {
    razorpayConfigured,
    stripeConfigured,
    demoSandboxFallback: !razorpayConfigured && !stripeConfigured,
    preferredProvider: (razorpayConfigured
      ? "RAZORPAY"
      : stripeConfigured
        ? "STRIPE"
        : "DEMO_SANDBOX") as PaymentProvider,
  };
}

/**
 * Initializes a gateway order in integer paise. Falls back cleanly to an
 * unmistakably labelled non-charging DEMO_SANDBOX order when credentials are absent.
 */
export async function initializePaymentSession(params: {
  orderNumber: string;
  amountPaise: number;
  requestedProvider?: PaymentProvider;
}): Promise<PaymentIntentInitResult> {
  const env = getEnv();

  if (
    (params.requestedProvider === "RAZORPAY" || !params.requestedProvider) &&
    hasLiveRazorpay()
  ) {
    const keyId = env.RAZORPAY_KEY_ID!.trim();
    const keySecret = env.RAZORPAY_KEY_SECRET!.trim();
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: "INR",
        receipt: params.orderNumber,
      }),
    });

    if (!res.ok) {
      throw new Error("Razorpay order initialization returned an upstream error.");
    }
    const data = (await res.json()) as { id: string };
    return {
      provider: "RAZORPAY",
      isDemo: false,
      providerOrderId: data.id,
      razorpayKeyId: keyId,
      amountPaise: params.amountPaise,
      currency: "INR",
    };
  }

  if (params.requestedProvider === "STRIPE" && hasLiveStripe()) {
    const body = new URLSearchParams({
      amount: String(params.amountPaise),
      currency: "inr",
      "metadata[order_number]": params.orderNumber,
    });
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY!.trim()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!res.ok) {
      throw new Error("Stripe PaymentIntent initialization failed.");
    }
    const data = (await res.json()) as { id: string; client_secret?: string };
    return {
      provider: "STRIPE",
      isDemo: false,
      providerOrderId: data.id,
      stripeClientSecret: data.client_secret,
      amountPaise: params.amountPaise,
      currency: "INR",
    };
  }

  // Non-charging demo payment flow when live gateway credentials are absent
  return {
    provider: "DEMO_SANDBOX",
    isDemo: true,
    providerOrderId: `demo_ord_${randomBytes(8).toString("hex")}`,
    amountPaise: params.amountPaise,
    currency: "INR",
  };
}
