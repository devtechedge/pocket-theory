import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupOrderForGuest } from "@/domains/orders/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const lookupSchema = z.object({
  orderNumber: z.string().trim().min(5).max(40),
  contactVerifier: z.string().trim().min(4).max(160),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = await checkRateLimit({
      scope: "order_lookup",
      identifier: hashClientIp(req),
      limit: 12,
      windowSeconds: 300,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many lookup attempts. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = lookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter your order number and billing email or 10-digit mobile." },
        { status: 400 },
      );
    }

    const order = await lookupOrderForGuest(parsed.data);
    if (!order) {
      return NextResponse.json(
        {
          error:
            "No order matched that combination of Order Number and email/mobile.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to look up order." },
      { status: 500 },
    );
  }
}
