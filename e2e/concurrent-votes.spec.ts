import { test, expect } from "@playwright/test";
import { resetDb, login } from "./helpers";
import postgres from "postgres";

const DB_URL = "postgres://meal_hq:meal_hq@localhost:5433/meal_hq_e2e";

async function seedRoundWithOption() {
  const sql = postgres(DB_URL, { max: 1 });
  const [el] = await sql`SELECT id FROM users WHERE name = 'Eleni'`;
  const [round] =
    await sql`INSERT INTO rounds (date, meal_type, status, opened_by) VALUES (CURRENT_DATE, 'dinner', 'open', ${el.id}) RETURNING id`;
  const [opt] =
    await sql`INSERT INTO meal_options (round_id, name, position) VALUES (${round.id}, 'Pastitsio', 0) RETURNING id`;
  await sql.end();
  return { roundId: round.id as string, optionId: opt.id as string };
}

test.beforeEach(async () => {
  await resetDb();
});

test("two kids voting concurrently both register", async ({ browser }) => {
  const { roundId } = await seedRoundWithOption();

  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  const p1 = await c1.newPage();
  const p2 = await c2.newPage();
  await login(p1, "Polys");
  await login(p2, "Mary");

  await Promise.all([p1.goto(`/round/${roundId}`), p2.goto(`/round/${roundId}`)]);

  // Wait for the vote button to be ready (hydrated) on both pages before clicking.
  await Promise.all([
    p1.getByRole("button", { name: /Pastitsio/ }).waitFor({ state: "visible" }),
    p2.getByRole("button", { name: /Pastitsio/ }).waitFor({ state: "visible" }),
  ]);

  // Click + await the PUT response on each page concurrently. We pair the click
  // with waitForResponse on the same page so we know the vote actually landed.
  await Promise.all([
    Promise.all([
      p1.waitForResponse(
        (r) => r.url().includes("/vote") && r.request().method() === "PUT" && r.status() === 200
      ),
      p1.getByRole("button", { name: /Pastitsio/ }).click(),
    ]),
    Promise.all([
      p2.waitForResponse(
        (r) => r.url().includes("/vote") && r.request().method() === "PUT" && r.status() === 200
      ),
      p2.getByRole("button", { name: /Pastitsio/ }).click(),
    ]),
  ]);

  await expect.poll(async () => {
    await p1.reload();
    return await p1.locator(".tabular-nums").first().textContent();
  }).toBe("2");

  await c1.close();
  await c2.close();
});
