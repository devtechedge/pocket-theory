import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(160),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = await checkRateLimit({
      scope: "newsletter",
      identifier: hashClientIp(req),
      limit: 8,
      windowSeconds: 300,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const email = parsed.data.email.toLowerCase();

    await db
      .insert(newsletterSubscribers)
      .values({
        id: `nws-${randomBytes(10).toString("hex")}`,
        email,
        source: "storefront_footer",
      })
      .onConflictDoNothing({ target: newsletterSubscribers.email });

    return NextResponse.json({
      ok: true,
      message: "Subscribed to Pocket Theory product notes and guide dispatches.",
    });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to process subscription right now." },
      { status: 500 },
    );
  }
}
