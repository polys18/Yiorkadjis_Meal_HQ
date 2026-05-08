import { db } from "@/db/client";
import { loginAttempts } from "@/db/schema";
import { and, eq, gt, gte, desc } from "drizzle-orm";
import { COOLDOWN } from "@/lib/constants";

export async function recordAttempt(userId: string, successful: boolean): Promise<void> {
  await db.insert(loginAttempts).values({ userId, successful });
}

async function recentFailureCount(userId: string): Promise<number> {
  const since = new Date(Date.now() - COOLDOWN.WINDOW_SECONDS * 1000);
  const lastSuccess = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.userId, userId), eq(loginAttempts.successful, true)))
    .orderBy(desc(loginAttempts.attemptedAt))
    .limit(1);
  const lastSuccessAt = lastSuccess[0]?.attemptedAt;
  // Failures strictly after the last success, AND within the rolling window.
  // Use strict > for the success cutoff so failures at the same timestamp
  // as the success are excluded (defaultNow() can produce identical
  // microsecond timestamps for adjacent inserts in tests).
  const failures = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.userId, userId),
        eq(loginAttempts.successful, false),
        gte(loginAttempts.attemptedAt, since),
        ...(lastSuccessAt ? [gt(loginAttempts.attemptedAt, lastSuccessAt)] : [])
      )
    );
  return failures.length;
}

export async function isOnCooldown(userId: string): Promise<boolean> {
  return (await recentFailureCount(userId)) >= COOLDOWN.MAX_FAILURES;
}

export async function secondsUntilUnlock(userId: string): Promise<number> {
  const recent = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.userId, userId), eq(loginAttempts.successful, false)))
    .orderBy(desc(loginAttempts.attemptedAt))
    .limit(1);
  if (!recent[0]) return 0;
  const elapsed = Math.floor((Date.now() - recent[0].attemptedAt.getTime()) / 1000);
  return Math.max(0, COOLDOWN.LOCKOUT_SECONDS - elapsed);
}
