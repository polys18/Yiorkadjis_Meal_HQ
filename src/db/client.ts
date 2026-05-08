import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _pg?: ReturnType<typeof postgres> };
const queryClient = globalForDb._pg ?? postgres(process.env.DATABASE_URL!, { max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb._pg = queryClient;

export const db = drizzle(queryClient, { schema });
