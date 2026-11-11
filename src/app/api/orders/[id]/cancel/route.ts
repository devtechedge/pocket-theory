import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthorizationError, requireApiUser } from "@/domains/auth/rbac";
import {
  cancelOrderWithStockRelease,
  CheckoutValidationError,
  getOrderWithDetails,
} from "@/domains/orders/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const cancelSchema = z.object({
  reason: z.string().trim().min(3).max(200).default("Cancelled by customer"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await params;

    const existing = await getOrderWithDetails(id);
    if (!existing || existing.order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = cancelSchema.safeParse(body);
    const reason = parsed.success
      ? parsed.data.reason
      : "Cancelled by customer";

    const updated = await cancelOrderWithStockRelease({
      orderId: existing.order.id,
      actorUserId: user.id,
      reason,
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    if (err instanceof CheckoutValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Could not cancel order." },
      { status: 500 },
    );
  }
}
