import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { inventoryMovements, productVariants } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const adjustSchema = z.object({
  variantId: z.string().min(1).max(80),
  delta: z
    .number()
    .int()
    .min(-500)
    .max(500)
    .refine((n) => n !== 0, "Delta cannot be zero."),
  reason: z.enum(["ADMIN_RESTOCK", "ADMIN_DAMAGE", "ADMIN_AUDIT"]),
  note: z.string().trim().min(2).max(200),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_INVENTORY");
    const body = await req.json();
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid stock adjustment.",
        },
        { status: 400 },
      );
    }

    const { variantId, delta, reason, note } = parsed.data;
    const db = await getDb();

    const result = await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (!before) {
        throw new Error("Variant not found.");
      }

      const [updated] = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${delta}` })
        .where(
          and(
            eq(productVariants.id, variantId),
            sql`${productVariants.stock} + ${delta} >= 0`,
          ),
        )
        .returning({ stock: productVariants.stock });

      if (!updated) {
        throw new Error("Adjustment would make variant stock negative.");
      }

      await tx.insert(inventoryMovements).values({
        id: `mov-${randomBytes(10).toString("hex")}`,
        variantId,
        actorUserId: actor.id,
        delta,
        balanceAfter: updated.stock,
        reason,
        note,
      });

      return {
        sku: before.sku,
        previousStock: before.stock,
        newStock: updated.stock,
      };
    });

    await writeAuditLog({
      actor,
      action: "ADJUST_INVENTORY",
      entityType: "VARIANT",
      entityId: variantId,
      summary: `${reason} on ${result.sku}: ${result.previousStock} -> ${result.newStock} (${note}).`,
      beforeJson: { stock: result.previousStock },
      afterJson: { stock: result.newStock, delta, reason },
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Adjustment failed." },
      { status: 400 },
    );
  }
}
