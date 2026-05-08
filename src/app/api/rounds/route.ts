import { NextRequest, NextResponse } from "next/server";
import { requireMom } from "@/lib/auth/current-user";
import { createRound } from "@/lib/rounds/mutations";
import { RoundError } from "@/lib/rounds/errors";
import { createRoundSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireMom();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createRoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const round = await createRound({ userId: user.id, ...parsed.data });
    return NextResponse.json({ round }, { status: 201 });
  } catch (e) {
    if (e instanceof RoundError && e.code === "DUPLICATE_SLOT") {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    }
    throw e;
  }
}
