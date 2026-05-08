import { db } from "@/db/client";
import { rounds, mealOptions, votes, auditLog } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { publishRoundEvent } from "@/lib/events/pubsub";

export type VoteErrorCode = "ROUND_CLOSED" | "ROUND_NOT_FOUND" | "OPTION_NOT_IN_ROUND";

export class VoteError extends Error {
  constructor(public code: VoteErrorCode, message: string) {
    super(message);
    this.name = "VoteError";
  }
}

export async function castVote(params: {
  userId: string;
  roundId: string;
  mealOptionId: string;
}) {
  await db.transaction(async (tx) => {
    const [round] = await tx.select().from(rounds).where(eq(rounds.id, params.roundId)).limit(1);
    if (!round) throw new VoteError("ROUND_NOT_FOUND", "Round not found");
    if (round.status !== "open") throw new VoteError("ROUND_CLOSED", "Round is closed");

    const [opt] = await tx
      .select()
      .from(mealOptions)
      .where(and(eq(mealOptions.id, params.mealOptionId), eq(mealOptions.roundId, params.roundId)))
      .limit(1);
    if (!opt) throw new VoteError("OPTION_NOT_IN_ROUND", "Option not in round");

    const [existing] = await tx
      .select()
      .from(votes)
      .where(and(eq(votes.roundId, params.roundId), eq(votes.userId, params.userId)))
      .limit(1);

    if (existing) {
      await tx
        .update(votes)
        .set({ mealOptionId: params.mealOptionId, updatedAt: new Date() })
        .where(eq(votes.id, existing.id));
      await tx.insert(auditLog).values({
        userId: params.userId,
        action: "change_vote",
        roundId: params.roundId,
        payload: { from: existing.mealOptionId, to: params.mealOptionId },
      });
    } else {
      await tx.insert(votes).values({
        roundId: params.roundId,
        mealOptionId: params.mealOptionId,
        userId: params.userId,
      });
      await tx.insert(auditLog).values({
        userId: params.userId,
        action: "vote",
        roundId: params.roundId,
        payload: { mealOptionId: params.mealOptionId },
      });
    }
  });
  publishRoundEvent({ type: "vote-changed", roundId: params.roundId });
}
