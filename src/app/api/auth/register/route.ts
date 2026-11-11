import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { createSessionForUser } from "@/domains/auth/session";
import { hashPasswordSync } from "@/lib/crypto-password";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number.")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(160),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ipHash = hashClientIp(req);
    const rl = await checkRateLimit({
      scope: "auth_register",
      identifier: ipHash,
      limit: 12,
      windowSeconds: 600,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a moment." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid account details." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const email = parsed.data.email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const userId = `usr-${randomBytes(10).toString("hex")}`;
    await db.insert(users).values({
      id: userId,
      email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      passwordHash: hashPasswordSync(parsed.data.password),
      role: "CUSTOMER",
      isActive: true,
    });

    await createSessionForUser({
      userId,
      ipHash,
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        user: {
          id: userId,
          email,
          fullName: parsed.data.fullName,
          role: "CUSTOMER",
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 },
    );
  }
}
