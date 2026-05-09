"use client";
import { useEffect, useRef, useState } from "react";
import { VoterChip } from "@/components/family/VoterChip";
import type { OptionWithVotes } from "@/lib/rounds/queries";

function useCountUp(target: number, durationMs = 400) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (to - from) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

export function MealOptionRow({
  option,
  myUserId,
  disabled,
  onTap,
}: {
  option: OptionWithVotes;
  myUserId: string;
  disabled: boolean;
  onTap: () => void;
}) {
  const isMine = option.votes.some((v) => v.userId === myUserId);
  const count = useCountUp(option.votes.length);
  const base =
    "w-full text-left rounded-card border bg-surface shadow-card p-4 transition active:scale-[0.97]";
  const stateCls = isMine
    ? "border-primary bg-primary/5"
    : disabled
    ? "border-border opacity-90"
    : "border-border hover:bg-surface-2";
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className={`${base} ${stateCls}`}
      aria-pressed={isMine}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="font-medium">{option.name}</div>
          {option.note && <div className="text-text-muted text-sm">{option.note}</div>}
        </div>
        <div className="font-serif text-2xl tabular-nums">{count}</div>
      </div>
      {option.votes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-3">
          {option.votes.map((v) => (
            <VoterChip key={v.id} name={v.userName} color={v.userColor} />
          ))}
        </div>
      )}
    </button>
  );
}
