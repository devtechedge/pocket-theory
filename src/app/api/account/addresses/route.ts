import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { addresses } from "@/db/schema";
import { AuthorizationError, requireApiUser } from "@/domains/auth/rbac";
import { INDIAN_STATES_AND_UTS } from "@/domains/shipping/pin-service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const addressSchema = z.object({
  label: z.string().trim().min(1).max(32).default("Home"),
  recipientName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  stateCode: z.string().trim().length(2),
  pinCode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code."),
  isDefault: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid address." },
        { status: 400 },
      );
    }

    const stateMeta = INDIAN_STATES_AND_UTS.find(
      (s) => s.code === parsed.data.stateCode,
    );
    if (!stateMeta) {
      return NextResponse.json(
        { error: "Invalid Indian state code." },
        { status: 400 },
      );
    }

    const db = await getDb();
    if (parsed.data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, user.id));
    }

    const [created] = await db
      .insert(addresses)
      .values({
        id: `adr-${randomBytes(10).toString("hex")}`,
        userId: user.id,
        label: parsed.data.label,
        recipientName: parsed.data.recipientName,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        landmark: parsed.data.landmark || null,
        city: parsed.data.city,
        stateName: stateMeta.name,
        stateCode: stateMeta.code,
        pinCode: parsed.data.pinCode,
        isDefault: parsed.data.isDefault,
      })
      .returning();

    return NextResponse.json({ address: created }, { status: 201 });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Unable to save address." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json({ error: "Missing address id." }, { status: 400 });
    }
    const db = await getDb();
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Unable to delete address." },
      { status: 500 },
    );
  }
}
