import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { recordAttempt, isOnCooldown, secondsUntilUnlock } from "./cooldown";
import { getTestDb, resetTestDb, closeTestDb } from "@/tests/helpers/db";
import { users } from "@/db/schema";

let userId: string;

beforeEach(async () => {
  await resetTestDb();
  const [u] = await getTestDb()
    .insert(users)
    .values({ name: "TestUser", role: "kid", color: "#000", pinHash: "x" })
    .returning();
  userId = u.id;
});

afterAll(async () => {
  await closeTestDb();
});

describe("PIN cooldown", () => {
  it("is not on cooldown initially", async () => {
    expect(await isOnCooldown(userId)).toBe(false);
  });

  it("trips cooldown after 5 failures within window", async () => {
    for (let i = 0; i < 5; i++) await recordAttempt(userId, false);
    expect(await isOnCooldown(userId)).toBe(true);
    expect(await secondsUntilUnlock(userId)).toBeGreaterThan(0);
  });

  it("does not trip cooldown after 4 failures", async () => {
    for (let i = 0; i < 4; i++) await recordAttempt(userId, false);
    expect(await isOnCooldown(userId)).toBe(false);
  });

  it("a successful attempt clears prior failures", async () => {
    for (let i = 0; i < 4; i++) await recordAttempt(userId, false);
    await recordAttempt(userId, true);
    for (let i = 0; i < 4; i++) await recordAttempt(userId, false);
    expect(await isOnCooldown(userId)).toBe(false);
  });

  it("re-trips cooldown after 5 failures following a success", async () => {
    for (let i = 0; i < 5; i++) await recordAttempt(userId, false);
    await recordAttempt(userId, true);
    for (let i = 0; i < 5; i++) await recordAttempt(userId, false);
    expect(await isOnCooldown(userId)).toBe(true);
  });

  it("secondsUntilUnlock returns 0 after a successful login clears failures", async () => {
    for (let i = 0; i < 5; i++) await recordAttempt(userId, false);
    await recordAttempt(userId, true);
    expect(await secondsUntilUnlock(userId)).toBe(0);
  });
});
