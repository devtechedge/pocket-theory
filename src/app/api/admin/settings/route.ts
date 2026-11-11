import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { storeSettings } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const settingsSchema = z.object({
  checkoutEnabled: z.boolean(),
});

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_USERS_AND_SETTINGS");
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid operational setting." },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db
      .insert(storeSettings)
      .values({
        key: "checkout_enabled",
        valueJson: { enabled: parsed.data.checkoutEnabled },
        updatedBy: actor.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeSettings.key,
        set: {
          valueJson: { enabled: parsed.data.checkoutEnabled },
          updatedBy: actor.id,
          updatedAt: new Date(),
        },
      });

    await writeAuditLog({
      actor,
      action: "UPDATE_OPERATIONAL_SETTINGS",
      entityType: "SETTINGS",
      entityId: "checkout_enabled",
      summary: `Set checkout_enabled = ${parsed.data.checkoutEnabled}.`,
      afterJson: { checkoutEnabled: parsed.data.checkoutEnabled },
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: "Settings update failed." },
      { status: 500 },
    );
  }
}
