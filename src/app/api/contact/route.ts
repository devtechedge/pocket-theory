import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { contactInquiries } from "@/db/schema";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  topic: z.string().trim().min(2).max(80),
  orderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(1500),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = await checkRateLimit({
      scope: "contact_submit",
      identifier: hashClientIp(req),
      limit: 6,
      windowSeconds: 600,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many messages submitted. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid inquiry fields." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const ticketId = `inq-${randomBytes(6).toString("hex")}`;
    await db.insert(contactInquiries).values({
      id: ticketId,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
      topic: parsed.data.topic,
      orderNumber: parsed.data.orderNumber || null,
      message: parsed.data.message,
      status: "OPEN",
    });

    return NextResponse.json(
      {
        ok: true,
        ticketId,
        message: `Inquiry recorded (${ticketId}). Target acknowledgement within 48 hours per Consumer Protection (E-Commerce) Rules.`,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to record inquiry." },
      { status: 500 },
    );
  }
}
