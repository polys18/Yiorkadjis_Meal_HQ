import { config } from "dotenv";
import { afterAll } from "vitest";
import { closeTestDb } from "./db";

config({ path: ".env.test", override: true });

afterAll(async () => {
  await closeTestDb();
});
