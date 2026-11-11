import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { returnRequests } from "@/db/schema";
import { AuthorizationError, requireApiUser } from "@/domains/auth/rbac";
import { getOrderWithDetails } from "@/domains/orders/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const returnSchema = z.object({
  orderItemId: z.string().min(1).max(80),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().min(5).max(500),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await params;

    const detail = await getOrderWithDetails(id);
    if (!detail || detail.order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (detail.order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cancelled orders are not eligible for return." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = returnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide item, reason, and condition details." },
        { status: 400 },
      );
    }

    const line = detail.items.find((i) => i.id === parsed.data.orderItemId);
    if (!line) {
      return NextResponse.json(
        { error: "Order item not found on this order." },
        { status: 404 },
      );
    }

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.orderId, detail.order.id),
          eq(returnRequests.orderItemId, line.id),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A return request already exists for this line item." },
        { status: 409 },
      );
    }

    const [created] = await db
      .insert(returnRequests)
      .values({
        id: `ret-${randomBytes(10).toString("hex")}`,
        orderId: detail.order.id,
        orderItemId: line.id,
        userId: user.id,
        reason: parsed.data.reason,
        details: parsed.data.details,
        status: "REQUESTED",
        refundAmountPaise: line.lineTotalPaise,
      })
      .returning();

    return NextResponse.json({ returnRequest: created }, { status: 201 });
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
    return NextResponse.json(
      { error: "Unable to submit return request." },
      { status: 500 },
    );
  }
}
