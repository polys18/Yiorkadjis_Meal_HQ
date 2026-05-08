import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPin } from "@/lib/auth/pin";
import { COOKIE_NAME, COOKIE_MAX_AGE, signSession } from "@/lib/auth/session";
import { isOnCooldown, recordAttempt, secondsUntilUnlock } from "@/lib/auth/cooldown";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, pin } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.name, name)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Unknown name" }, { status: 401 });
  }

  if (await isOnCooldown(user.id)) {
    const seconds = await secondsUntilUnlock(user.id);
    return NextResponse.json(
      { error: "Too many attempts", retryAfter: seconds },
      { status: 429 }
    );
  }

  const ok = await verifyPin(pin, user.pinHash);
  await recordAttempt(user.id, ok);
  if (!ok) return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role, color: user.color },
  });
  res.cookies.set(COOKIE_NAME, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
