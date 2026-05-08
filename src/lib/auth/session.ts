import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "meal_hq_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getSecret(): string {
  const s = process.env.COOKIE_SECRET;
  if (!s || s.length < 32) throw new Error("COOKIE_SECRET must be set and ≥ 32 chars");
  return s;
}

function hmac(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function signSession(userId: string): string {
  return `${userId}.${hmac(userId)}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [userId, sig] = parts;
  if (!userId || !sig) return null;
  const expected = hmac(userId);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return userId;
}
