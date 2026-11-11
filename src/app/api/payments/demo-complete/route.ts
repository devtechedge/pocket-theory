import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CheckoutValidationError,
  completeDemoPaymentForOrder,
} from "@/domains/orders/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const demoCompleteSchema = z.object({
  orderId: z.string().min(1).max(80),
  outcome: z.enum(["AUTHORIZE_DEMO", "FAIL_DEMO"]),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await req.json();
    const parsed = demoCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid demo payment request." },
        { status: 400 },
      );
    }

    const updatedOrder = await completeDemoPaymentForOrder(parsed.data);
    return NextResponse.json({
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        isDemoOrder: updatedOrder.isDemoOrder,
      },
    });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof CheckoutValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Demo payment sandbox step failed." },
      { status: 500 },
    );
  }
}
