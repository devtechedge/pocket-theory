import { createHash } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimitBuckets } from "@/db/schema";
import { getEnv } from "@/env";

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function hashClientIp(req: Request): string {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";
  return createHash("sha256")
    .update(`${getEnv().SESSION_PEPPER}:ip:${raw}`)
    .digest("hex")
    .slice(0, 24);
}

/**
 * PostgreSQL-backed fixed-window rate limiter so limits survive serverless cold starts.
 */
export async function checkRateLimit(params: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitDecision> {
  const db = await getDb();
  const now = new Date();
  const bucketKey = `${params.scope}:${params.identifier}`.slice(0, 180);

  // Opportunistic cleanup of expired buckets
  await db
    .delete(rateLimitBuckets)
    .where(lt(rateLimitBuckets.windowEndsAt, now))
    .catch(() => undefined);

  const [existing] = await db
    .select()
    .from(rateLimitBuckets)
    .where(eq(rateLimitBuckets.bucketKey, bucketKey))
    .limit(1);

  if (!existing || existing.windowEndsAt <= now) {
    const windowEndsAt = new Date(now.getTime() + params.windowSeconds * 1000);
    await db
      .insert(rateLimitBuckets)
      .values({
        bucketKey,
        hits: 1,
        windowEndsAt,
      })
      .onConflictDoUpdate({
        target: rateLimitBuckets.bucketKey,
        set: { hits: 1, windowEndsAt },
      });
    return {
      allowed: true,
      remaining: Math.max(0, params.limit - 1),
      retryAfterSeconds: 0,
    };
  }

  if (existing.hits >= params.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.windowEndsAt.getTime() - now.getTime()) / 1000),
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  const nextHits = existing.hits + 1;
  await db
    .update(rateLimitBuckets)
    .set({ hits: nextHits })
    .where(eq(rateLimitBuckets.bucketKey, bucketKey));

  return {
    allowed: true,
    remaining: Math.max(0, params.limit - nextHits),
    retryAfterSeconds: 0,
  };
}
