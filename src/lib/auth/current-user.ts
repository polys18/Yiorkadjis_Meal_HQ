import { cookies } from "next/headers";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, verifySession } from "./session";
import type { User } from "@/db/schema";

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = verifySession(jar.get(COOKIE_NAME)?.value);
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireMom(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "mom") throw new Error("FORBIDDEN");
  return user;
}
