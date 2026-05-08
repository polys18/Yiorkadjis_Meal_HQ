import { db } from "@/db/client";
import { rounds, mealOptions, votes, users } from "@/db/schema";
import { and, desc, eq, gte, ne, asc } from "drizzle-orm";
import type { MealType } from "@/lib/constants";
import { HISTORY_DAYS } from "@/lib/constants";

export type VoteWithUser = {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
};

export type OptionWithVotes = {
  id: string;
  name: string;
  note: string | null;
  position: number;
  votes: VoteWithUser[];
};

export type FullRound = {
  id: string;
  date: string;
  mealType: MealType;
  status: "open" | "closed" | "deleted";
  openedBy: string;
  openedAt: Date;
  closedAt: Date | null;
  cookingDecision: string[] | null;
  options: OptionWithVotes[];
};

async function buildFullRound(roundId: string): Promise<FullRound | null> {
  const [r] = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1);
  if (!r) return null;

  const opts = await db
    .select()
    .from(mealOptions)
    .where(eq(mealOptions.roundId, roundId))
    .orderBy(asc(mealOptions.position));

  const voteRows = await db
    .select({
      id: votes.id,
      mealOptionId: votes.mealOptionId,
      userId: votes.userId,
      userName: users.name,
      userColor: users.color,
    })
    .from(votes)
    .innerJoin(users, eq(users.id, votes.userId))
    .where(eq(votes.roundId, roundId));

  const byOption = new Map<string, VoteWithUser[]>();
  for (const v of voteRows) {
    const list = byOption.get(v.mealOptionId) ?? [];
    list.push({ id: v.id, userId: v.userId, userName: v.userName, userColor: v.userColor });
    byOption.set(v.mealOptionId, list);
  }

  return {
    id: r.id,
    date: r.date,
    mealType: r.mealType as MealType,
    status: r.status as FullRound["status"],
    openedBy: r.openedBy,
    openedAt: r.openedAt,
    closedAt: r.closedAt,
    cookingDecision: (r.cookingDecision ?? null) as string[] | null,
    options: opts.map((o) => ({
      id: o.id,
      name: o.name,
      note: o.note,
      position: o.position,
      votes: byOption.get(o.id) ?? [],
    })),
  };
}

export async function getRound(roundId: string): Promise<FullRound | null> {
  return buildFullRound(roundId);
}

export async function getTodayRounds(
  dateISO: string
): Promise<{ lunch: FullRound | null; dinner: FullRound | null }> {
  const result: { lunch: FullRound | null; dinner: FullRound | null } = {
    lunch: null,
    dinner: null,
  };
  for (const meal of ["lunch", "dinner"] as const) {
    const [r] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.date, dateISO), eq(rounds.mealType, meal), ne(rounds.status, "deleted")))
      .limit(1);
    if (r) {
      result[meal] = await buildFullRound(r.id);
    }
  }
  return result;
}

export async function listHistory(days: number = HISTORY_DAYS): Promise<FullRound[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const rows = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.status, "closed"), gte(rounds.date, cutoff)))
    .orderBy(desc(rounds.date), desc(rounds.closedAt));
  const out: FullRound[] = [];
  for (const r of rows) {
    const full = await buildFullRound(r.id);
    if (full) out.push(full);
  }
  return out;
}

export async function listOpenRoundsForBanner(
  yesterdayISO: string
): Promise<FullRound[]> {
  const rows = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.date, yesterdayISO), eq(rounds.status, "open")));
  const out: FullRound[] = [];
  for (const r of rows) {
    const full = await buildFullRound(r.id);
    if (full) out.push(full);
  }
  return out;
}
