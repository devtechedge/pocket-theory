import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { createSessionForUser } from "@/domains/auth/session";
import { verifyPasswordSync } from "@/lib/crypto-password";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(160),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ipHash = hashClientIp(req);
    const rl = await checkRateLimit({
      scope: "auth_login",
      identifier: ipHash,
      limit: 20,
      windowSeconds: 300,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address and password." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const email = parsed.data.email.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (
      !user ||
      !user.isActive ||
      !verifyPasswordSync(parsed.data.password, user.passwordHash)
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await createSessionForUser({
      userId: user.id,
      ipHash,
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to complete sign-in." },
      { status: 500 },
    );
  }
}
