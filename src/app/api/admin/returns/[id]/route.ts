import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  inventoryMovements,
  orderItems,
  orders,
  productVariants,
  returnRequests,
} from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { sendReturnStatusEmail } from "@/domains/notifications/email";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const patchReturnSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]),
  resolutionNote: z.string().trim().min(3).max(300),
  restockUnit: z.boolean().default(false),
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
    const parsed = patchReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide valid return status and resolution note." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const updated = await db.transaction(async (tx) => {
      const [ret] = await tx
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, id))
        .limit(1);

      if (!ret) throw new Error("Return request not found.");

      const [ord] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, ret.orderId))
        .limit(1);

      const [line] = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, ret.orderItemId))
        .limit(1);

      if (parsed.data.restockUnit && line?.variantId) {
        const [restored] = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${line.quantity}` })
          .where(eq(productVariants.id, line.variantId))
          .returning({ stock: productVariants.stock });

        if (restored) {
          await tx.insert(inventoryMovements).values({
            id: `mov-${randomBytes(10).toString("hex")}`,
            variantId: line.variantId,
            orderId: ret.orderId,
            actorUserId: actor.id,
            delta: line.quantity,
            balanceAfter: restored.stock,
            reason: "RETURN_RESTOCK",
            note: `Restocked from return ${ret.id}`,
          });
        }
      }

      const [saved] = await tx
        .update(returnRequests)
        .set({
          status: parsed.data.status,
          resolutionNote: parsed.data.resolutionNote,
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, ret.id))
        .returning();

      return { saved: saved!, ord };
    });

    if (updated.ord) {
      await sendReturnStatusEmail({
        toEmail: updated.ord.customerEmail,
        orderNumber: updated.ord.orderNumber,
        status: parsed.data.status,
        note: parsed.data.resolutionNote,
      }).catch(() => undefined);
    }

    await writeAuditLog({
      actor,
      action: "UPDATE_RETURN_REQUEST",
      entityType: "RETURN",
      entityId: id,
      summary: `Return ${id} marked ${parsed.data.status}: ${parsed.data.resolutionNote}`,
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({ returnRequest: updated.saved });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Return update failed." },
      { status: 400 },
    );
  }
}
