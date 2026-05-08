import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/current-user";
import { castVote, VoteError } from "@/lib/rounds/voting";
import { voteSchema } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    await castVote({ userId: user.id, roundId: id, mealOptionId: parsed.data.mealOptionId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof VoteError) {
      const status = e.code === "ROUND_CLOSED" ? 409 : e.code === "ROUND_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
