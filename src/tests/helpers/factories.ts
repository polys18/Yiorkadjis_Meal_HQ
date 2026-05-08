import { getTestDb } from "./db";
import { users, rounds, mealOptions, votes } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function makeUser(opts?: { name?: string; role?: "mom" | "kid"; color?: string }) {
  const db = getTestDb();
  const [u] = await db
    .insert(users)
    .values({
      name: opts?.name ?? `User-${Math.random().toString(36).slice(2, 8)}`,
      role: opts?.role ?? "kid",
      color: opts?.color ?? "#777",
      pinHash: await bcrypt.hash("0000", 4),
    })
    .returning();
  return u;
}

export async function makeRound(opts: {
  openedBy: string;
  date: string;
  mealType?: "lunch" | "dinner";
  status?: "open" | "closed" | "deleted";
  cookingDecision?: string[] | null;
  closedAt?: Date | null;
}) {
  const db = getTestDb();
  const [r] = await db
    .insert(rounds)
    .values({
      openedBy: opts.openedBy,
      date: opts.date,
      mealType: opts.mealType ?? "dinner",
      status: opts.status ?? "open",
      cookingDecision: opts.cookingDecision ?? null,
      closedAt: opts.closedAt ?? null,
    })
    .returning();
  return r;
}

export async function makeOption(opts: {
  roundId: string;
  name: string;
  position?: number;
  note?: string;
}) {
  const db = getTestDb();
  const [o] = await db
    .insert(mealOptions)
    .values({
      roundId: opts.roundId,
      name: opts.name,
      note: opts.note ?? null,
      position: opts.position ?? 0,
    })
    .returning();
  return o;
}

export async function makeVote(opts: {
  roundId: string;
  mealOptionId: string;
  userId: string;
}) {
  const db = getTestDb();
  const [v] = await db.insert(votes).values(opts).returning();
  return v;
}
