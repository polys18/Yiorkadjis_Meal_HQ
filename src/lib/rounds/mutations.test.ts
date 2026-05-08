import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDb, closeTestDb, getTestDb } from "@/tests/helpers/db";
import { makeUser, makeRound, makeOption } from "@/tests/helpers/factories";
import {
  createRound,
  closeRound,
  reopenRound,
  deleteRound,
  editOptions,
} from "./mutations";
import { rounds, mealOptions, votes } from "@/db/schema";
import { eq } from "drizzle-orm";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe("round mutations", () => {
  it("createRound inserts a round with ordered options", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const r = await createRound({
      userId: eleni.id,
      mealType: "dinner",
      date: "2026-05-08",
      options: [
        { name: "Pastitsio", note: "extra béchamel" },
        { name: "Mousaka" },
      ],
    });
    expect(r.id).toBeTruthy();
    const opts = await getTestDb().select().from(mealOptions).where(eq(mealOptions.roundId, r.id));
    expect(opts).toHaveLength(2);
    expect(opts.map((o) => o.position).sort()).toEqual([0, 1]);
  });

  it("createRound rejects duplicate date+mealType when one is open", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    await createRound({
      userId: eleni.id,
      mealType: "dinner",
      date: "2026-05-08",
      options: [{ name: "Pastitsio" }],
    });
    await expect(
      createRound({
        userId: eleni.id,
        mealType: "dinner",
        date: "2026-05-08",
        options: [{ name: "Other" }],
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("createRound surfaces DUPLICATE_SLOT even on race condition", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    // Pre-create directly via factory to skip the pre-SELECT guard
    await makeRound({ openedBy: eleni.id, date: "2026-05-08", mealType: "dinner" });
    await expect(
      createRound({
        userId: eleni.id,
        mealType: "dinner",
        date: "2026-05-08",
        options: [{ name: "Other" }],
      })
    ).rejects.toMatchObject({ code: "DUPLICATE_SLOT" });
  });

  it("closeRound sets status, closedAt, and cookingDecision", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const round = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    const opt = await makeOption({ roundId: round.id, name: "Pastitsio" });
    await closeRound({ userId: eleni.id, roundId: round.id, cookingDecision: [opt.id] });
    const [r] = await getTestDb().select().from(rounds).where(eq(rounds.id, round.id));
    expect(r.status).toBe("closed");
    expect(r.closedAt).not.toBeNull();
    expect(r.cookingDecision).toEqual([opt.id]);
  });

  it("reopenRound clears closedAt and cookingDecision", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const round = await makeRound({
      openedBy: eleni.id,
      date: "2026-05-08",
      status: "closed",
      closedAt: new Date(),
      cookingDecision: ["abc"],
    });
    await reopenRound({ userId: eleni.id, roundId: round.id });
    const [r] = await getTestDb().select().from(rounds).where(eq(rounds.id, round.id));
    expect(r.status).toBe("open");
    expect(r.closedAt).toBeNull();
    expect(r.cookingDecision).toBeNull();
  });

  it("deleteRound soft-deletes (status=deleted)", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const round = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    await deleteRound({ userId: eleni.id, roundId: round.id });
    const [r] = await getTestDb().select().from(rounds).where(eq(rounds.id, round.id));
    expect(r.status).toBe("deleted");
  });

  it("editOptions can add and remove options", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const round = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    const opt1 = await makeOption({ roundId: round.id, name: "A", position: 0 });
    await editOptions({
      userId: eleni.id,
      roundId: round.id,
      add: [{ name: "B" }],
      remove: [opt1.id],
    });
    const opts = await getTestDb()
      .select()
      .from(mealOptions)
      .where(eq(mealOptions.roundId, round.id));
    expect(opts.map((o) => o.name)).toEqual(["B"]);
  });
});
