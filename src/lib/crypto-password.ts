import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPasswordSync(
  plainPassword: string,
  explicitSaltHex?: string,
): string {
  const salt = explicitSaltHex
    ? Buffer.from(explicitSaltHex, "hex")
    : randomBytes(16);
  const derived = scryptSync(plainPassword, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPasswordSync(
  plainPassword: string,
  storedHash: string,
): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const actual = scryptSync(plainPassword, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
