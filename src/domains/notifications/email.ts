import { randomBytes } from "node:crypto";
import { getDb } from "@/db/client";
import { emailOutbox } from "@/db/schema";
import { getEnv } from "@/env";
import { formatPaise } from "@/lib/money";

export type TransactionalEmailTemplate =
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED"
  | "RETURN_UPDATED"
  | "PASSWORD_RESET";

export interface SendTransactionalEmailInput {
  toEmail: string;
  template: TransactionalEmailTemplate;
  subject: string;
  textBody: string;
  htmlBody: string;
  relatedOrderNumber?: string | null;
}

export async function dispatchTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<{ id: string; deliveryMode: "DEV_SINK" | "PROVIDER_SENT" }> {
  const db = await getDb();
  const env = getEnv();
  const id = `eml-${randomBytes(10).toString("hex")}`;

  // Always persist to email_outbox for operational auditability; if an external
  // HTTP provider key is configured, mark PROVIDER_SENT after delivery attempt.
  let deliveryMode: "DEV_SINK" | "PROVIDER_SENT" = "DEV_SINK";

  if (env.EMAIL_PROVIDER_API_KEY?.trim()) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EMAIL_PROVIDER_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [input.toEmail],
          subject: input.subject,
          text: input.textBody,
          html: input.htmlBody,
        }),
      });
      if (res.ok) {
        deliveryMode = "PROVIDER_SENT";
      }
    } catch {
      deliveryMode = "DEV_SINK";
    }
  }

  await db.insert(emailOutbox).values({
    id,
    toEmail: input.toEmail.toLowerCase(),
    template: input.template,
    subject: input.subject,
    textBody: input.textBody,
    htmlBody: input.htmlBody,
    relatedOrderNumber: input.relatedOrderNumber ?? null,
    deliveryMode,
  });

  return { id, deliveryMode };
}

export async function sendOrderConfirmationEmail(params: {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  grandTotalPaise: number;
  isDemoOrder: boolean;
}) {
  const modeNote = params.isDemoOrder
    ? "NON-CHARGING DEMO ORDER (No payment instrument was billed)"
    : "PAYMENT VERIFIED";
  const formattedTotal = formatPaise(params.grandTotalPaise);

  return dispatchTransactionalEmail({
    toEmail: params.toEmail,
    template: "ORDER_CONFIRMED",
    relatedOrderNumber: params.orderNumber,
    subject: `[POCKET THEORY] Order ${params.orderNumber} Confirmed (${formattedTotal})`,
    textBody: `Hello ${params.customerName},\n\nYour POCKET THEORY order ${params.orderNumber} totaling ${formattedTotal} (inclusive of GST) has been recorded.\nPayment state: ${modeNote}.\n\nTrack status anytime at /track-order.\n\n- POCKET THEORY Operations`,
    htmlBody: `<div style="font-family:sans-serif;color:#111418"><h2>Order ${params.orderNumber}</h2><p>Hello ${params.customerName},</p><p>Total: <strong>${formattedTotal}</strong> (inclusive of GST).</p><p>State: <strong>${modeNote}</strong></p></div>`,
  });
}

export async function sendOrderShippedEmail(params: {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  carrierName: string;
  trackingNumber: string;
}) {
  return dispatchTransactionalEmail({
    toEmail: params.toEmail,
    template: "ORDER_SHIPPED",
    relatedOrderNumber: params.orderNumber,
    subject: `[POCKET THEORY] Order ${params.orderNumber} Dispatched`,
    textBody: `Hello ${params.customerName},\n\nOrder ${params.orderNumber} has been marked dispatched via ${params.carrierName} (Tracking Ref: ${params.trackingNumber}).\nNote: Carrier tracking fields are manually recorded unless live courier credentials are configured.\n\n- POCKET THEORY Operations`,
    htmlBody: `<div style="font-family:sans-serif;color:#111418"><h2>Order ${params.orderNumber} Dispatched</h2><p>Carrier: <strong>${params.carrierName}</strong> | Tracking Ref: <code>${params.trackingNumber}</code></p></div>`,
  });
}

export async function sendOrderCancelledEmail(params: {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  reason: string;
}) {
  return dispatchTransactionalEmail({
    toEmail: params.toEmail,
    template: "ORDER_CANCELLED",
    relatedOrderNumber: params.orderNumber,
    subject: `[POCKET THEORY] Order ${params.orderNumber} Cancelled`,
    textBody: `Hello ${params.customerName},\n\nOrder ${params.orderNumber} has been cancelled (${params.reason}) and reserved stock has been released.\n\n- POCKET THEORY Operations`,
    htmlBody: `<div style="font-family:sans-serif;color:#111418"><h2>Order ${params.orderNumber} Cancelled</h2><p>Reason: ${params.reason}</p></div>`,
  });
}

export async function sendReturnStatusEmail(params: {
  toEmail: string;
  orderNumber: string;
  status: string;
  note: string;
}) {
  return dispatchTransactionalEmail({
    toEmail: params.toEmail,
    template: "RETURN_UPDATED",
    relatedOrderNumber: params.orderNumber,
    subject: `[POCKET THEORY] Return Update for ${params.orderNumber}: ${params.status}`,
    textBody: `Return status for order ${params.orderNumber} is now ${params.status}.\nDetails: ${params.note}`,
    htmlBody: `<div style="font-family:sans-serif;color:#111418"><h2>Return ${params.status}</h2><p>Order: ${params.orderNumber}</p><p>${params.note}</p></div>`,
  });
}
