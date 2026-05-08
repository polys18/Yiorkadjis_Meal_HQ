import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireMom } from "@/lib/auth/current-user";
import { getRound } from "@/lib/rounds/queries";
import { closeRound, reopenRound, deleteRound } from "@/lib/rounds/mutations";
import { RoundError } from "@/lib/rounds/errors";
import { closeRoundSchema } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const round = await getRound(id);
  if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ round });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user;
  try {
    user = await requireMom();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "reopen") {
    try {
      await reopenRound({ userId: user.id, roundId: id });
      return NextResponse.json({ ok: true });
    } catch (e) {
      if (e instanceof RoundError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
      }
      throw e;
    }
  }
  if (body.action === "close") {
    const parsed = closeRoundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    try {
      await closeRound({ userId: user.id, roundId: id, cookingDecision: parsed.data.cookingDecision });
      return NextResponse.json({ ok: true });
    } catch (e) {
      if (e instanceof RoundError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
      }
      throw e;
    }
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  let user;
  try {
    user = await requireMom();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteRound({ userId: user.id, roundId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof RoundError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    }
    throw e;
  }
}
