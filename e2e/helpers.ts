import { Page, expect } from "@playwright/test";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const DB_URL = "postgres://meal_hq:meal_hq@localhost:5433/meal_hq_e2e";

export async function resetDb() {
  const sql = postgres(DB_URL, { max: 1 });
  await sql`TRUNCATE TABLE login_attempts, audit_log, votes, meal_options, rounds, users RESTART IDENTITY CASCADE`;
  const hash = await bcrypt.hash("0000", 4);
  for (const m of [
    { name: "Eleni", role: "mom", color: "#C77D49" },
    { name: "Mary", role: "kid", color: "#D08585" },
    { name: "Polys", role: "kid", color: "#7B8754" },
    { name: "Fotini", role: "kid", color: "#D4A847" },
    { name: "Constantinos", role: "kid", color: "#4A6B7C" },
  ]) {
    await sql`INSERT INTO users (name, role, color, pin_hash) VALUES (${m.name}, ${m.role}, ${m.color}, ${hash})`;
  }
  await sql.end();
}

export async function login(page: Page, name: string, pin = "0000") {
  await page.goto("/login");
  // Button accessible name is "<Name> <role>" (e.g. "Eleni mom"), so match by name prefix.
  await page.getByRole("button", { name: new RegExp(`^${name}\\b`) }).click();
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: d, exact: true }).click();
  }
  await expect(page).toHaveURL("/");
}
