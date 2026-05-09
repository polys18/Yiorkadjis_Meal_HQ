import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireMom } from "@/lib/auth/current-user";
import { hashPin } from "@/lib/auth/pin";
import { resetPinSchema } from "@/lib/validation/schemas";
import { writeAudit } from "@/lib/audit/log";

export async function POST(req: NextRequest) {
  let mom;
  try {
    mom = await requireMom();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = resetPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const hash = await hashPin(parsed.data.newPin);
  const [u] = await db
    .update(users)
    .set({ pinHash: hash })
    .where(eq(users.id, parsed.data.userId))
    .returning();
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await writeAudit({
    userId: mom.id,
    action: "reset_pin",
    payload: { targetUserId: u.id, targetName: u.name },
  });
  return NextResponse.json({ ok: true });
}
