import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/current-user";
import { subscribeToRound } from "@/lib/events/pubsub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireUser();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await ctx.params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      send({ type: "hello", roundId: id });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 20_000);

      const unsub = subscribeToRound(id, (ev) => send(ev));

      const onAbort = () => {
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
