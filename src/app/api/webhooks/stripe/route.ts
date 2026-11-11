import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { webhookEvents } from "@/db/schema";
import { markVerifiedGatewayOrderPaid } from "@/domains/orders/service";
import { verifyStripeWebhookSignature } from "@/domains/payments/adapters";
import { getEnv } from "@/env";

export async function POST(req: Request) {
  const secret = getEnv().STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  const valid = verifyStripeWebhookSignature({
    rawBody,
    signatureHeader: signature,
    webhookSecret: secret,
  });

  if (!valid) {
    return NextResponse.json(
      { error: "Stripe signature verification failed." },
      { status: 401 },
    );
  }

  let parsed: {
    id?: string;
    type?: string;
    data?: { object?: { id?: string; latest_charge?: string } };
  };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventId = parsed.id?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  }

  const db = await getDb();
  const [already] = await db
    .select()
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.provider, "STRIPE"),
        eq(webhookEvents.eventId, eventId),
      ),
    )
    .limit(1);

  if (already) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  await db.insert(webhookEvents).values({
    id: `whk-${randomBytes(10).toString("hex")}`,
    provider: "STRIPE",
    eventId,
    eventType: parsed.type ?? "unknown",
    signatureValid: true,
    payloadSummaryJson: { type: parsed.type },
  });

  if (parsed.type === "payment_intent.succeeded") {
    const intentId = parsed.data?.object?.id;
    const chargeId = parsed.data?.object?.latest_charge ?? intentId;
    if (intentId && chargeId) {
      await markVerifiedGatewayOrderPaid({
        provider: "STRIPE",
        providerOrderId: intentId,
        providerPaymentId: String(chargeId),
      }).catch(() => undefined);
    }
  }

  return NextResponse.json({ ok: true, deduplicated: false });
}
