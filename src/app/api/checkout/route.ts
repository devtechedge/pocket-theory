import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/domains/auth/session";
import { clearCartById, getHydratedCart } from "@/domains/cart/service";
import {
  CheckoutValidationError,
  createOrderFromCheckout,
  InsufficientStockError,
} from "@/domains/orders/service";
import { INDIAN_STATES_AND_UTS } from "@/domains/shipping/pin-service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

const checkoutBodySchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(120),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(160),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  buyerGstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
      "Invalid 15-character GSTIN format.",
    )
    .optional()
    .or(z.literal("")),
  shippingMethod: z.enum(["STANDARD", "EXPRESS"]).default("STANDARD"),
  requestedProvider: z
    .enum(["DEMO_SANDBOX", "RAZORPAY", "STRIPE"])
    .optional(),
  address: z.object({
    line1: z.string().trim().min(4).max(160),
    line2: z.string().trim().max(160).optional(),
    landmark: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2).max(80),
    stateCode: z.string().trim().length(2),
    pinCode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code."),
  }),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const rl = await checkRateLimit({
      scope: "checkout_submit",
      identifier: hashClientIp(req),
      limit: 15,
      windowSeconds: 300,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many checkout submissions. Please wait a moment." },
        { status: 429 },
      );
    }

    const raw = await req.json();
    const parsed = checkoutBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Please check your delivery and contact details.",
        },
        { status: 400 },
      );
    }

    const stateMeta = INDIAN_STATES_AND_UTS.find(
      (s) => s.code === parsed.data.address.stateCode,
    );
    if (!stateMeta) {
      return NextResponse.json(
        { error: "Select a valid Indian State or Union Territory." },
        { status: 400 },
      );
    }

    const [user, cart] = await Promise.all([
      getCurrentUser(),
      getHydratedCart({
        shippingMethod: parsed.data.shippingMethod,
        destinationStateCode: stateMeta.code,
      }),
    ]);

    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 },
      );
    }

    const result = await createOrderFromCheckout({
      idempotencyKey: parsed.data.idempotencyKey,
      userId: user?.id ?? null,
      customerEmail: parsed.data.customerEmail,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      buyerGstin: parsed.data.buyerGstin || null,
      shippingMethod: parsed.data.shippingMethod,
      couponCode: cart.pricing.appliedCouponCode,
      requestedProvider: parsed.data.requestedProvider,
      shippingAddress: {
        recipientName: parsed.data.customerName,
        phone: parsed.data.customerPhone,
        line1: parsed.data.address.line1,
        line2: parsed.data.address.line2,
        landmark: parsed.data.address.landmark,
        city: parsed.data.address.city,
        stateName: stateMeta.name,
        stateCode: stateMeta.code,
        pinCode: parsed.data.address.pinCode,
      },
      items: cart.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    });

    if (cart.cartId && !result.deduplicated) {
      await clearCartById(cart.cartId);
    }

    return NextResponse.json(
      {
        order: {
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          grandTotalPaise: result.order.grandTotalPaise,
          paymentProvider: result.order.paymentProvider,
          isDemoOrder: result.order.isDemoOrder,
          status: result.order.status,
          paymentStatus: result.order.paymentStatus,
        },
        payment: result.payment,
        deduplicated: result.deduplicated,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof CheckoutValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Unable to create order." },
      { status: 500 },
    );
  }
}
