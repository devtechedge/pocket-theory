import { NextResponse } from "next/server";
import { z } from "zod";
import { markVerifiedGatewayOrderPaid } from "@/domains/orders/service";
import { verifyRazorpayCheckoutSignature } from "@/domains/payments/adapters";
import { getEnv, hasLiveRazorpay } from "@/env";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(4).max(120),
  razorpay_payment_id: z.string().min(4).max(120),
  razorpay_signature: z.string().min(16).max(256),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!hasLiveRazorpay()) {
      return NextResponse.json(
        { error: "Razorpay live keys are not configured." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Malformed Razorpay verification payload." },
        { status: 400 },
      );
    }

    const valid = verifyRazorpayCheckoutSignature({
      razorpayOrderId: parsed.data.razorpay_order_id,
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      razorpaySignature: parsed.data.razorpay_signature,
      secret: getEnv().RAZORPAY_KEY_SECRET!,
    });

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid Razorpay payment signature." },
        { status: 400 },
      );
    }

    const order = await markVerifiedGatewayOrderPaid({
      provider: "RAZORPAY",
      providerOrderId: parsed.data.razorpay_order_id,
      providerPaymentId: parsed.data.razorpay_payment_id,
    });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 400 },
    );
  }
}
