import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { sessions, users, type UserRole } from "@/db/schema";
import { getEnv } from "@/env";

export const SESSION_COOKIE_NAME = "pt_session";
export const GUEST_TOKEN_COOKIE_NAME = "pt_guest";
const SESSION_TTL_DAYS = 14;
const GUEST_TTL_DAYS = 60;

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
}

export function hashToken(rawToken: string): string {
  return createHash("sha256")
    .update(`${getEnv().SESSION_PEPPER}:${rawToken}`)
    .digest("hex");
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSessionForUser(params: {
  userId: string;
  ipHash?: string;
  userAgent?: string | null;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const db = await getDb();
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: `ses-${randomBytes(12).toString("hex")}`,
    userId: params.userId,
    tokenHash,
    expiresAt,
    ipHash: params.ipHash ?? null,
    userAgent: params.userAgent?.slice(0, 240) ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { rawToken, expiresAt };
}

export async function clearCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    const db = await getDb();
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(rawToken)))
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(rawToken)),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    role: row.role,
  };
}

/**
 * Reads guest cart/wishlist token if present without mutating cookies during RSC render.
 */
export async function readGuestTokenHash(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_TOKEN_COOKIE_NAME)?.value;
  return raw ? hashToken(raw) : null;
}

/**
 * Reads or creates guest cart/wishlist token inside a Route Handler / Server Action.
 */
export async function getOrCreateGuestTokenHash(): Promise<string> {
  const cookieStore = await cookies();
  let raw = cookieStore.get(GUEST_TOKEN_COOKIE_NAME)?.value;
  if (!raw) {
    raw = generateOpaqueToken();
    const expires = new Date(
      Date.now() + GUEST_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    cookieStore.set(GUEST_TOKEN_COOKIE_NAME, raw, {
      httpOnly: true,
      sameSite: "lax",
      secure: getEnv().NODE_ENV === "production",
      path: "/",
      expires,
    });
  }
  return hashToken(raw);
}
