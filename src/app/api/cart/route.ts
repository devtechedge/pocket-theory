import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getHydratedCart,
  upsertCartVariantQuantity,
} from "@/domains/cart/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const mutateCartSchema = z.object({
  variantId: z.string().min(1).max(80),
  quantity: z.number().int().min(0).max(10),
  mode: z.enum(["add", "set"]).default("add"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shippingMethod =
    url.searchParams.get("shipping") === "EXPRESS" ? "EXPRESS" : "STANDARD";
  const stateCode = url.searchParams.get("state") ?? "27";
  const cart = await getHydratedCart({
    shippingMethod,
    destinationStateCode: stateCode,
  });
  return NextResponse.json({ cart });
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await req.json();
    const parsed = mutateCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart item request." },
        { status: 400 },
      );
    }
    const cart = await upsertCartVariantQuantity(parsed.data);
    return NextResponse.json({ cart });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update shopping cart.",
      },
      { status: 400 },
    );
  }
}
