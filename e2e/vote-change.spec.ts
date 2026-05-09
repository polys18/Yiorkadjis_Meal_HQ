import { test, expect } from "@playwright/test";
import { resetDb, login } from "./helpers";
import postgres from "postgres";

const DB_URL = "postgres://meal_hq:meal_hq@localhost:5433/meal_hq_e2e";

async function seedRoundWithTwoOptions() {
  const sql = postgres(DB_URL, { max: 1 });
  const [el] = await sql`SELECT id FROM users WHERE name = 'Eleni'`;
  const [round] =
    await sql`INSERT INTO rounds (date, meal_type, status, opened_by) VALUES (CURRENT_DATE, 'dinner', 'open', ${el.id}) RETURNING id`;
  await sql`INSERT INTO meal_options (round_id, name, position) VALUES (${round.id}, 'Pastitsio', 0)`;
  await sql`INSERT INTO meal_options (round_id, name, position) VALUES (${round.id}, 'Mousaka', 1)`;
  await sql.end();
  return round.id as string;
}

test.beforeEach(async () => {
  await resetDb();
});

test("changing vote results in single vote on the latest option", async ({ page }) => {
  const roundId = await seedRoundWithTwoOptions();
  await login(page, "Polys");
  await page.goto(`/round/${roundId}`);

  await page.getByRole("button", { name: /Pastitsio/ }).click();
  await expect(page.getByRole("button", { name: /Pastitsio/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.getByRole("button", { name: /Mousaka/ }).click();
  await expect.poll(async () => {
    await page.reload();
    return await page.getByRole("button", { name: /Mousaka/ }).getAttribute("aria-pressed");
  }).toBe("true");
  await expect(page.getByRole("button", { name: /Pastitsio/ })).toHaveAttribute(
    "aria-pressed",
    "false"
  );

  // Single Pastitsio vote should be 0, Mousaka 1
  const counts = await page.locator(".tabular-nums").allTextContents();
  expect(counts).toEqual(["0", "1"]); // Pastitsio first by position, Mousaka second
});
