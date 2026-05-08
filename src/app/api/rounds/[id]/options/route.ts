import { NextRequest, NextResponse } from "next/server";
import { requireMom } from "@/lib/auth/current-user";
import { editOptions } from "@/lib/rounds/mutations";
import { editOptionsSchema } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user;
  try {
    user = await requireMom();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = editOptionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await editOptions({ userId: user.id, roundId: id, ...parsed.data });
  return NextResponse.json({ ok: true });
}
