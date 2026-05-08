import { db } from "@/db/client";
import { rounds, mealOptions, auditLog } from "@/db/schema";
import { and, eq, max, ne } from "drizzle-orm";
import type { MealType } from "@/lib/constants";

export async function createRound(params: {
  userId: string;
  mealType: MealType;
  date: string;
  options: { name: string; note?: string }[];
}) {
  const [existing] = await db
    .select()
    .from(rounds)
    .where(
      and(
        eq(rounds.date, params.date),
        eq(rounds.mealType, params.mealType),
        ne(rounds.status, "deleted")
      )
    )
    .limit(1);
  if (existing) {
    throw new Error("Round already exists for this slot");
  }

  return await db.transaction(async (tx) => {
    const [r] = await tx
      .insert(rounds)
      .values({
        date: params.date,
        mealType: params.mealType,
        status: "open",
        openedBy: params.userId,
      })
      .returning();
    if (params.options.length > 0) {
      await tx.insert(mealOptions).values(
        params.options.map((o, i) => ({
          roundId: r.id,
          name: o.name.trim(),
          note: o.note?.trim() || null,
          position: i,
        }))
      );
    }
    await tx.insert(auditLog).values({
      userId: params.userId,
      action: "create_round",
      roundId: r.id,
      payload: { optionCount: params.options.length },
    });
    return r;
  });
}

export async function closeRound(params: {
  userId: string;
  roundId: string;
  cookingDecision: string[];
}) {
  return await db.transaction(async (tx) => {
    const [r] = await tx
      .update(rounds)
      .set({
        status: "closed",
        closedAt: new Date(),
        cookingDecision: params.cookingDecision,
      })
      .where(and(eq(rounds.id, params.roundId), eq(rounds.status, "open")))
      .returning();
    if (!r) throw new Error("Round not open");
    await tx.insert(auditLog).values({
      userId: params.userId,
      action: "close_round",
      roundId: r.id,
      payload: { cookingDecision: params.cookingDecision },
    });
    return r;
  });
}

export async function reopenRound(params: { userId: string; roundId: string }) {
  return await db.transaction(async (tx) => {
    const [r] = await tx
      .update(rounds)
      .set({ status: "open", closedAt: null, cookingDecision: null })
      .where(and(eq(rounds.id, params.roundId), eq(rounds.status, "closed")))
      .returning();
    if (!r) throw new Error("Round not closed");
    await tx.insert(auditLog).values({
      userId: params.userId,
      action: "reopen_round",
      roundId: r.id,
    });
    return r;
  });
}

export async function deleteRound(params: { userId: string; roundId: string }) {
  return await db.transaction(async (tx) => {
    const [r] = await tx
      .update(rounds)
      .set({ status: "deleted" })
      .where(and(eq(rounds.id, params.roundId), ne(rounds.status, "deleted")))
      .returning();
    if (!r) throw new Error("Round already deleted");
    await tx.insert(auditLog).values({
      userId: params.userId,
      action: "delete_round",
      roundId: r.id,
    });
    return r;
  });
}

export async function editOptions(params: {
  userId: string;
  roundId: string;
  add?: { name: string; note?: string }[];
  remove?: string[];
}) {
  return await db.transaction(async (tx) => {
    if (params.remove?.length) {
      for (const id of params.remove) {
        await tx
          .delete(mealOptions)
          .where(and(eq(mealOptions.id, id), eq(mealOptions.roundId, params.roundId)));
      }
    }
    if (params.add?.length) {
      const [maxRow] = await tx
        .select({ m: max(mealOptions.position) })
        .from(mealOptions)
        .where(eq(mealOptions.roundId, params.roundId));
      let nextPos = (maxRow?.m ?? -1) + 1;
      await tx.insert(mealOptions).values(
        params.add.map((o) => ({
          roundId: params.roundId,
          name: o.name.trim(),
          note: o.note?.trim() || null,
          position: nextPos++,
        }))
      );
    }
    await tx.insert(auditLog).values({
      userId: params.userId,
      action: "edit_options",
      roundId: params.roundId,
      payload: { added: params.add?.length ?? 0, removed: params.remove?.length ?? 0 },
    });
  });
}
