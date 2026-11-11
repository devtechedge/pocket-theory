import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activeDbDriver, getDb } from "@/db/client";
import { products } from "@/db/schema";
import { isDemoMode } from "@/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const [totalRow] = await db.select({ value: count() }).from(products);
    const [activeRow] = await db
      .select({ value: count() })
      .from(products)
      .where(eq(products.status, "ACTIVE"));

    return NextResponse.json(
      {
        status: "ok",
        brand: "POCKET THEORY",
        dbDriver: activeDbDriver(),
        demoMode: isDemoMode(),
        totalSkus: totalRow?.value ?? 0,
        activeSkus: activeRow?.value ?? 0,
        commitSha:
          process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        brand: "POCKET THEORY",
        message: "Database health check failed.",
      },
      { status: 503 },
    );
  }
}
