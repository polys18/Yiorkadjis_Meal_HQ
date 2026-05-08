import { db } from "@/db/client";
import { loginAttempts } from "@/db/schema";
import { and, eq, gte, desc, sql } from "drizzle-orm";
import { COOLDOWN } from "@/lib/constants";

export async function recordAttempt(userId: string, successful: boolean): Promise<void> {
  await db.insert(loginAttempts).values({ userId, successful });
}

async function recentFailureCount(userId: string): Promise<number> {
  const since = new Date(Date.now() - COOLDOWN.WINDOW_SECONDS * 1000);
  // Failures strictly after the last success, AND within the rolling window.
  // The success cutoff uses a SQL subquery so the timestamp comparison stays
  // at Postgres microsecond precision -- round-tripping a timestamp through a
  // JS Date truncates to milliseconds and can mis-include same-millisecond
  // failures. COALESCE handles the no-prior-success case.
  const failures = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.userId, userId),
        eq(loginAttempts.successful, false),
        gte(loginAttempts.attemptedAt, since),
        sql`${loginAttempts.attemptedAt} > COALESCE((
          SELECT MAX(${loginAttempts.attemptedAt}) FROM ${loginAttempts}
          WHERE ${loginAttempts.userId} = ${userId} AND ${loginAttempts.successful} = true
        ), '-infinity'::timestamptz)`
      )
    );
  return failures.length;
}

export async function isOnCooldown(userId: string): Promise<boolean> {
  return (await recentFailureCount(userId)) >= COOLDOWN.MAX_FAILURES;
}

export async function secondsUntilUnlock(userId: string): Promise<number> {
  // Apply the same "failures only AFTER the last success" filter used in
  // recentFailureCount. Use a SQL subquery so the timestamp comparison stays
  // at Postgres microsecond precision (round-tripping through a JS Date
  // truncates to milliseconds and can mis-include a same-millisecond failure).
  const recent = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.userId, userId),
        eq(loginAttempts.successful, false),
        sql`${loginAttempts.attemptedAt} > COALESCE((
          SELECT MAX(${loginAttempts.attemptedAt}) FROM ${loginAttempts}
          WHERE ${loginAttempts.userId} = ${userId} AND ${loginAttempts.successful} = true
        ), '-infinity'::timestamptz)`
      )
    )
    .orderBy(desc(loginAttempts.attemptedAt))
    .limit(1);

  if (!recent[0]) return 0;
  const elapsed = Math.floor((Date.now() - recent[0].attemptedAt.getTime()) / 1000);
  return Math.max(0, COOLDOWN.LOCKOUT_SECONDS - elapsed);
}
