import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetTestDb, closeTestDb } from "@/tests/helpers/db";
import { makeUser, makeRound, makeOption, makeVote } from "@/tests/helpers/factories";
import { getRound, getTodayRounds, listHistory } from "./queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe("round queries", () => {
  it("getRound returns round with options and votes including voters", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const polys = await makeUser({ name: "Polys" });
    const round = await makeRound({ openedBy: eleni.id, date: "2026-05-08" });
    const opt = await makeOption({ roundId: round.id, name: "Pastitsio" });
    await makeVote({ roundId: round.id, mealOptionId: opt.id, userId: polys.id });

    const r = await getRound(round.id);
    expect(r).not.toBeNull();
    expect(r!.options).toHaveLength(1);
    expect(r!.options[0].name).toBe("Pastitsio");
    expect(r!.options[0].votes).toHaveLength(1);
    expect(r!.options[0].votes[0].userName).toBe("Polys");
  });

  it("getTodayRounds returns lunch and dinner for given date, ignoring deleted", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    await makeRound({ openedBy: eleni.id, date: "2026-05-08", mealType: "lunch" });
    await makeRound({ openedBy: eleni.id, date: "2026-05-08", mealType: "dinner" });
    await makeRound({
      openedBy: eleni.id,
      date: "2026-05-08",
      mealType: "lunch",
      status: "deleted",
    });

    const result = await getTodayRounds("2026-05-08");
    expect(result.lunch).not.toBeNull();
    expect(result.dinner).not.toBeNull();
    expect(result.lunch!.status).toBe("open");
  });

  it("listHistory returns closed rounds in descending date order", async () => {
    const eleni = await makeUser({ role: "mom", name: "Eleni" });
    const r1 = await makeRound({
      openedBy: eleni.id,
      date: "2026-05-06",
      status: "closed",
      closedAt: new Date(),
    });
    const r2 = await makeRound({
      openedBy: eleni.id,
      date: "2026-05-07",
      status: "closed",
      closedAt: new Date(),
    });
    await makeRound({ openedBy: eleni.id, date: "2026-05-08", status: "open" });

    const hist = await listHistory(30);
    const ids = hist.map((h) => h.id);
    expect(ids).toEqual([r2.id, r1.id]);
  });
});
