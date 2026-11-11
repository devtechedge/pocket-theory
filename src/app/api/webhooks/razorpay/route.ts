import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { webhookEvents } from "@/db/schema";
import { markVerifiedGatewayOrderPaid } from "@/domains/orders/service";
import { verifyRazorpayWebhookSignature } from "@/domains/payments/adapters";
import { getEnv } from "@/env";

export async function POST(req: Request) {
  const secret = getEnv().RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json(
      { error: "Razorpay webhook secret is not configured." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const eventId = req.headers.get("x-razorpay-event-id")?.trim() ?? "";
  const rawBody = await req.text();

  const valid = verifyRazorpayWebhookSignature({
    rawBody,
    signatureHeader: signature,
    webhookSecret: secret,
  });

  if (!valid) {
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 401 },
    );
  }

  let parsed: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
    };
  };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const resolvedEventId =
    eventId ||
    `${parsed.event ?? "unknown"}:${
      parsed.payload?.payment?.entity?.id ?? "none"
    }`;

  const db = await getDb();
  const [already] = await db
    .select()
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.provider, "RAZORPAY"),
        eq(webhookEvents.eventId, resolvedEventId),
      ),
    )
    .limit(1);

  if (already) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  await db.insert(webhookEvents).values({
    id: `whk-${randomBytes(10).toString("hex")}`,
    provider: "RAZORPAY",
    eventId: resolvedEventId,
    eventType: parsed.event ?? "unknown",
    signatureValid: true,
    payloadSummaryJson: { event: parsed.event },
  });

  if (
    parsed.event === "payment.captured" ||
    parsed.event === "order.paid"
  ) {
    const providerOrderId = parsed.payload?.payment?.entity?.order_id;
    const providerPaymentId = parsed.payload?.payment?.entity?.id;
    if (providerOrderId && providerPaymentId) {
      await markVerifiedGatewayOrderPaid({
        provider: "RAZORPAY",
        providerOrderId,
        providerPaymentId,
      }).catch(() => undefined);
    }
  }

  return NextResponse.json({ ok: true, deduplicated: false });
}
