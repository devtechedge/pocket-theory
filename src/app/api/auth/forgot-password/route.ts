import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { dispatchTransactionalEmail } from "@/domains/notifications/email";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const forgotSchema = z.object({
  email: z.string().trim().email().max(160),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = await checkRateLimit({
      scope: "auth_forgot",
      identifier: hashClientIp(req),
      limit: 6,
      windowSeconds: 600,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Please wait before requesting another reset message." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const db = await getDb();
    const [existing] = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Constant public response regardless of account existence to prevent user enumeration
    if (existing) {
      await dispatchTransactionalEmail({
        toEmail: email,
        template: "PASSWORD_RESET",
        subject: "[POCKET THEORY] Password Reset Instructions",
        textBody: `Hello ${existing.fullName},\n\nA password reset was requested for your POCKET THEORY account. In this demo environment, outbound reset emails are recorded in the email_outbox sink rather than sent over public SMTP.`,
        htmlBody: `<p>Hello ${existing.fullName}, password reset requested (recorded in development email_outbox sink).</p>`,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that address, reset instructions have been queued to the email adapter.",
    });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to queue password reset." },
      { status: 500 },
    );
  }
}
