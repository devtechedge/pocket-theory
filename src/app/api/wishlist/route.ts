import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listWishlistProductIds,
  toggleWishlistProduct,
} from "@/domains/wishlist/service";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";

const toggleSchema = z.object({
  productId: z.string().min(1).max(80),
});

export async function GET() {
  const productIds = await listWishlistProductIds();
  return NextResponse.json({ productIds });
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid product identifier." },
        { status: 400 },
      );
    }
    const result = await toggleWishlistProduct(parsed.data.productId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Unable to update wishlist." },
      { status: 400 },
    );
  }
}
