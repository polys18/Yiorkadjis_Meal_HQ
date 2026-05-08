import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getTestDb() {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for tests (check .env.test)");
    }
    _client = postgres(process.env.DATABASE_URL, { max: 2 });
    _db = drizzle(_client, { schema });
  }
  return _db!;
}

export async function resetTestDb() {
  const db = getTestDb();
  await db.execute(
    `TRUNCATE TABLE login_attempts, audit_log, votes, meal_options, rounds, users RESTART IDENTITY CASCADE`
  );
}

export async function closeTestDb() {
  await _client?.end();
  _client = null;
  _db = null;
}
