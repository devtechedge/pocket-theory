import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const patchUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([
    "CUSTOMER",
    "SUPPORT_OPS",
    "CATALOG_MANAGER",
    "SUPER_ADMIN",
  ]),
  isActive: z.boolean(),
});

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_USERS_AND_SETTINGS");
    const body = await req.json();
    const parsed = patchUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role assignment payload." },
        { status: 400 },
      );
    }

    if (
      parsed.data.userId === actor.id &&
      (parsed.data.role !== "SUPER_ADMIN" || !parsed.data.isActive)
    ) {
      return NextResponse.json(
        { error: "Super Admins cannot demote or deactivate their own session." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const [before] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!before) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await db
      .update(users)
      .set({
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, before.id));

    await writeAuditLog({
      actor,
      action: "UPDATE_USER_ROLE",
      entityType: "USER",
      entityId: before.id,
      summary: `Updated ${before.email}: role ${before.role} -> ${parsed.data.role}, active=${parsed.data.isActive}.`,
      beforeJson: { role: before.role, isActive: before.isActive },
      afterJson: { role: parsed.data.role, isActive: parsed.data.isActive },
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
    return NextResponse.json({ error: "Role update failed." }, { status: 500 });
  }
}
