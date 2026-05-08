import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";
import { FAMILY } from "@/lib/constants";

config({ path: ".env" });
config({ path: ".env.local", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  const placeholderHash = await bcrypt.hash("0000", rounds);

  for (const member of FAMILY) {
    await db
      .insert(users)
      .values({
        name: member.name,
        role: member.role,
        color: member.color,
        pinHash: placeholderHash,
      })
      .onConflictDoNothing({ target: users.name });
  }
  await client.end();
  console.log(`Seeded ${FAMILY.length} family members (PIN = 0000 for all).`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
