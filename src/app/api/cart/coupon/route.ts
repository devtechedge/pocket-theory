import { NextResponse } from "next/server";
import { z } from "zod";
import { applyCouponToActiveCart } from "@/domains/cart/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const couponSchema = z.object({
  code: z.string().max(32).nullable(),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = await checkRateLimit({
      scope: "coupon",
      identifier: hashClientIp(req),
      limit: 20,
      windowSeconds: 300,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many promo attempts. Please try again shortly." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid promo code format." },
        { status: 400 },
      );
    }

    const cart = await applyCouponToActiveCart(parsed.data.code);
    return NextResponse.json({ cart });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Promo code invalid." },
      { status: 400 },
    );
  }
}
