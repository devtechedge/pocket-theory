import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { coupons } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(24)
    .regex(/^[A-Z0-9_-]+$/),
  description: z.string().trim().min(4).max(180),
  discountType: z.enum(["PERCENTAGE", "FIXED_PAISE"]),
  discountValue: z.number().int().positive().max(500000),
  minSubtotalPaise: z.number().int().min(0).default(0),
  maxDiscountPaise: z.number().int().positive().nullable().default(null),
  usageLimit: z.number().int().positive().nullable().default(200),
});

const toggleCouponSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_PROMOTIONS");
    const body = await req.json();
    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid coupon payload." },
        { status: 400 },
      );
    }

    const d = parsed.data;
    if (d.discountType === "PERCENTAGE" && d.discountValue > 50) {
      return NextResponse.json(
        { error: "Percentage coupons are capped at 50%." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const id = `cpn-${randomBytes(8).toString("hex")}`;
    const [created] = await db
      .insert(coupons)
      .values({
        id,
        code: d.code,
        description: d.description,
        discountType: d.discountType,
        discountValue: d.discountValue,
        minSubtotalPaise: d.minSubtotalPaise,
        maxDiscountPaise: d.maxDiscountPaise,
        usageLimit: d.usageLimit,
        isActive: true,
      })
      .returning();

    await writeAuditLog({
      actor,
      action: "CREATE_COUPON",
      entityType: "COUPON",
      entityId: id,
      summary: `Created coupon ${d.code} (${d.discountType}: ${d.discountValue}).`,
      afterJson: { code: d.code, discountValue: d.discountValue },
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({ coupon: created }, { status: 201 });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create coupon." },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_PROMOTIONS");
    const body = await req.json();
    const parsed = toggleCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid toggle." }, { status: 400 });
    }

    const db = await getDb();
    await db
      .update(coupons)
      .set({ isActive: parsed.data.isActive })
      .where(eq(coupons.id, parsed.data.id));

    await writeAuditLog({
      actor,
      action: "TOGGLE_COUPON",
      entityType: "COUPON",
      entityId: parsed.data.id,
      summary: `Set coupon ${parsed.data.id} active=${parsed.data.isActive}.`,
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
    return NextResponse.json({ error: "Toggle failed." }, { status: 500 });
  }
}
