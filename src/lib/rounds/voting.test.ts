import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDb, closeTestDb, getTestDb } from "@/tests/helpers/db";
import { makeUser, makeRound, makeOption } from "@/tests/helpers/factories";
import { castVote } from "./voting";
import { votes } from "@/db/schema";
import { eq } from "drizzle-orm";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe("castVote", () => {
  it("casts a new vote", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const polys = await makeUser({ name: "Polys" });
    const round = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    const opt = await makeOption({ roundId: round.id, name: "Pastitsio" });

    await castVote({ userId: polys.id, roundId: round.id, mealOptionId: opt.id });
    const rows = await getTestDb().select().from(votes).where(eq(votes.userId, polys.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].mealOptionId).toBe(opt.id);
  });

  it("changes a vote (UPSERT, single row)", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const polys = await makeUser({ name: "Polys" });
    const round = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    const a = await makeOption({ roundId: round.id, name: "A", position: 0 });
    const b = await makeOption({ roundId: round.id, name: "B", position: 1 });

    await castVote({ userId: polys.id, roundId: round.id, mealOptionId: a.id });
    await castVote({ userId: polys.id, roundId: round.id, mealOptionId: b.id });

    const rows = await getTestDb().select().from(votes).where(eq(votes.userId, polys.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].mealOptionId).toBe(b.id);
  });

  it("rejects voting on closed round", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const polys = await makeUser({ name: "Polys" });
    const round = await makeRound({
      openedBy: eleni.id,
      date: "2026-05-08",
      status: "closed",
      closedAt: new Date(),
    });
    const opt = await makeOption({ roundId: round.id, name: "Pastitsio" });

    await expect(
      castVote({ userId: polys.id, roundId: round.id, mealOptionId: opt.id })
    ).rejects.toThrow(/closed/i);
  });

  it("rejects vote when option does not belong to round", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const polys = await makeUser({ name: "Polys" });
    const r1 = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    const r2 = await makeRound({ openedBy: eleni.id, date: "2026-05-08", mealType: "lunch" });
    const opt2 = await makeOption({ roundId: r2.id, name: "Foreign" });

    await expect(
      castVote({ userId: polys.id, roundId: r1.id, mealOptionId: opt2.id })
    ).rejects.toThrow(/option/i);
  });
});
