import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { categories, products } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

const patchCategorySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("category"),
    categoryId: z.string().min(1),
    heroTagline: z.string().trim().min(5).max(160),
    isFeatured: z.boolean(),
  }),
  z.object({
    kind: z.literal("merchandising"),
    productId: z.string().min(1),
    searchBoost: z.number().int().min(-50).max(100),
    isFeatured: z.boolean(),
    isNewDrop: z.boolean(),
  }),
]);

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_CATALOG");
    const body = await req.json();
    const parsed = patchCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid category or merchandising update." },
        { status: 400 },
      );
    }

    const db = await getDb();
    if (parsed.data.kind === "category") {
      await db
        .update(categories)
        .set({
          heroTagline: parsed.data.heroTagline,
          isFeatured: parsed.data.isFeatured,
        })
        .where(eq(categories.id, parsed.data.categoryId));

      await writeAuditLog({
        actor,
        action: "UPDATE_CATEGORY",
        entityType: "CATEGORY",
        entityId: parsed.data.categoryId,
        summary: `Updated category ${parsed.data.categoryId} tagline/featured flag.`,
        ipHash: hashClientIp(req),
      });
    } else {
      await db
        .update(products)
        .set({
          searchBoost: parsed.data.searchBoost,
          isFeatured: parsed.data.isFeatured,
          isNewDrop: parsed.data.isNewDrop,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parsed.data.productId));

      await writeAuditLog({
        actor,
        action: "UPDATE_SEARCH_MERCHANDISING",
        entityType: "PRODUCT",
        entityId: parsed.data.productId,
        summary: `Updated search boost (${parsed.data.searchBoost}) & flags on ${parsed.data.productId}.`,
        ipHash: hashClientIp(req),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: "Update failed." },
      { status: 500 },
    );
  }
}
