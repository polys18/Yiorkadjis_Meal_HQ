"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MealOptionRow } from "./MealOptionRow";
import { RoundHeader } from "./RoundHeader";
import type { FullRound } from "@/lib/rounds/queries";

type Me = { id: string; role: "mom" | "kid" };

export function RoundDetail({
  initial,
  me,
  onOpenClose,
  onOpenEdit,
  onReopen,
}: {
  initial: FullRound;
  me: Me;
  onOpenClose: () => void;
  onOpenEdit: () => void;
  onReopen: () => void;
}) {
  const [round, setRound] = useState<FullRound>(initial);
  const router = useRouter();
  const sseFails = useRef(0);

  async function refresh() {
    const res = await fetch(`/api/rounds/${round.id}`);
    if (res.ok) {
      const data = await res.json();
      setRound(data.round);
    }
  }

  useEffect(() => {
    let es: EventSource | null = null;
    let pollHandle: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (pollHandle) return;
      pollHandle = setInterval(refresh, 5_000);
    }
    function stopPolling() {
      if (pollHandle) clearInterval(pollHandle);
      pollHandle = null;
    }

    function startSSE() {
      es = new EventSource(`/api/rounds/${round.id}/stream`);
      es.onmessage = () => {
        sseFails.current = 0;
        void refresh();
      };
      es.onerror = () => {
        sseFails.current += 1;
        es?.close();
        es = null;
        if (sseFails.current >= 3) {
          startPolling();
        } else {
          setTimeout(startSSE, 1_000);
        }
      };
    }

    startSSE();
    return () => {
      es?.close();
      stopPolling();
    };
  }, [round.id]);

  async function vote(optionId: string) {
    const res = await fetch(`/api/rounds/${round.id}/vote`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mealOptionId: optionId }),
    });
    if (res.status === 409) {
      router.refresh();
      return;
    }
    await refresh();
  }

  const isMom = me.role === "mom";
  const isOpen = round.status === "open";

  return (
    <div className="space-y-4 pb-24">
      <RoundHeader date={round.date} mealType={round.mealType} status={round.status} />

      {!isOpen && round.cookingDecision && round.cookingDecision.length > 0 && (
        <div className="rounded-card bg-success/10 border border-success/30 p-3 text-sm">
          <strong>Cooking:</strong>{" "}
          {round.options
            .filter((o) => round.cookingDecision!.includes(o.id))
            .map((o) => o.name)
            .join(" + ")}
        </div>
      )}

      <div className="space-y-3">
        {round.options.map((o) => (
          <MealOptionRow
            key={o.id}
            option={o}
            myUserId={me.id}
            disabled={!isOpen}
            onTap={() => isOpen && vote(o.id)}
          />
        ))}
      </div>

      {isOpen && isMom && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <button
              type="button"
              onClick={onOpenEdit}
              className="px-4 py-2 rounded-btn border border-border text-sm"
            >
              Edit options
            </button>
            <button
              type="button"
              onClick={onOpenClose}
              className="flex-1 px-4 py-2 rounded-btn bg-primary text-white font-medium"
            >
              Close & decide cooking
            </button>
          </div>
        </div>
      )}

      {!isOpen && isMom && round.status === "closed" && (
        <button
          type="button"
          onClick={onReopen}
          className="text-sm text-text-muted underline"
        >
          Reopen round
        </button>
      )}
    </div>
  );
}
