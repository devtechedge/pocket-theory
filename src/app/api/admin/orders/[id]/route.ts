import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { sendOrderShippedEmail } from "@/domains/notifications/email";
import { cancelOrderWithStockRelease } from "@/domains/orders/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const updateOrderSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "DEMO_CONFIRMED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  carrierName: z.string().trim().max(80).optional().nullable(),
  trackingNumber: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(240).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_ORDERS_RETURNS");
    const { id } = await params;

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order fulfilment update." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (parsed.data.status === "CANCELLED" && existing.status !== "CANCELLED") {
      const cancelled = await cancelOrderWithStockRelease({
        orderId: existing.id,
        actorUserId: actor.id,
        reason: parsed.data.note || "Cancelled by store operations",
      });
      await writeAuditLog({
        actor,
        action: "ADMIN_CANCEL_ORDER",
        entityType: "ORDER",
        entityId: existing.id,
        summary: `Cancelled ${existing.orderNumber} and released reserved stock.`,
        beforeJson: { status: existing.status },
        afterJson: { status: "CANCELLED" },
        ipHash: hashClientIp(req),
      });
      return NextResponse.json({ order: cancelled });
    }

    const now = new Date();
    const nextPaymentStatus =
      parsed.data.status === "REFUNDED"
        ? "REFUNDED"
        : existing.paymentStatus;

    if (parsed.data.status === "REFUNDED") {
      await db
        .update(payments)
        .set({ status: "REFUNDED", updatedAt: now })
        .where(eq(payments.orderId, existing.id));
    }

    const [updated] = await db
      .update(orders)
      .set({
        status: parsed.data.status,
        paymentStatus: nextPaymentStatus,
        carrierName:
          parsed.data.carrierName !== undefined
            ? parsed.data.carrierName || null
            : existing.carrierName,
        trackingNumber:
          parsed.data.trackingNumber !== undefined
            ? parsed.data.trackingNumber || null
            : existing.trackingNumber,
        shippedAt:
          parsed.data.status === "SHIPPED" && !existing.shippedAt
            ? now
            : existing.shippedAt,
        deliveredAt:
          parsed.data.status === "DELIVERED" && !existing.deliveredAt
            ? now
            : existing.deliveredAt,
        updatedAt: now,
      })
      .where(eq(orders.id, existing.id))
      .returning();

    if (
      parsed.data.status === "SHIPPED" &&
      existing.status !== "SHIPPED" &&
      updated
    ) {
      await sendOrderShippedEmail({
        toEmail: updated.customerEmail,
        customerName: updated.customerName,
        orderNumber: updated.orderNumber,
        carrierName: updated.carrierName ?? "Manual Dispatch",
        trackingNumber: updated.trackingNumber ?? "Pending AWB",
      }).catch(() => undefined);
    }

    await writeAuditLog({
      actor,
      action: "UPDATE_ORDER_FULFILMENT",
      entityType: "ORDER",
      entityId: existing.id,
      summary: `Order ${existing.orderNumber}: ${existing.status} -> ${parsed.data.status}.`,
      beforeJson: {
        status: existing.status,
        trackingNumber: existing.trackingNumber,
      },
      afterJson: {
        status: parsed.data.status,
        trackingNumber: parsed.data.trackingNumber,
      },
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Order update failed." },
      { status: 400 },
    );
  }
}
