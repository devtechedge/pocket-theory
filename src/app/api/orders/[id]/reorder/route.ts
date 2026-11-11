import { NextResponse } from "next/server";
import { AuthorizationError, requireApiUser } from "@/domains/auth/rbac";
import { upsertCartVariantQuantity } from "@/domains/cart/service";
import { getOrderWithDetails } from "@/domains/orders/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

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

    let addedLines = 0;
    for (const item of detail.items) {
      if (!item.variantId) continue;
      try {
        await upsertCartVariantQuantity({
          variantId: item.variantId,
          quantity: item.quantity,
          mode: "add",
        });
        addedLines += 1;
      } catch {
        // Variant out of stock or unpublished - skip gracefully
      }
    }

    return NextResponse.json({ ok: true, addedLines });
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
      { error: "Unable to reorder items." },
      { status: 500 },
    );
  }
}
