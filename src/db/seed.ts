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

  let inserted = 0;
  for (const member of FAMILY) {
    const result = await db
      .insert(users)
      .values({
        name: member.name,
        role: member.role,
        color: member.color,
        pinHash: placeholderHash,
      })
      .onConflictDoNothing({ target: users.name })
      .returning({ id: users.id });
    inserted += result.length;
  }
  await client.end();
  if (inserted === 0) {
    console.log("Seed complete. All family members already exist.");
  } else {
    console.log(`Seed complete. Inserted ${inserted} new family member(s) with default PIN 0000.`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
