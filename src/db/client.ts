import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Cache the postgres client across Next.js HMR reloads in dev so we don't
// exhaust connections. In production each serverless invocation gets its own.
const globalForDb = globalThis as unknown as { _mealHqPg?: ReturnType<typeof postgres> };
const queryClient = globalForDb._mealHqPg ?? postgres(process.env.DATABASE_URL, { max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb._mealHqPg = queryClient;

export const db = drizzle(queryClient, { schema });
