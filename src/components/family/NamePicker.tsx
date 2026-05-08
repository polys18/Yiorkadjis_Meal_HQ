"use client";
import { FAMILY } from "@/lib/constants";

export function NamePicker({ onPick }: { onPick: (name: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FAMILY.map((m) => (
        <button
          key={m.name}
          type="button"
          onClick={() => onPick(m.name)}
          className="rounded-card border border-border bg-surface shadow-card p-5 text-left transition active:scale-95"
        >
          <div
            className="h-12 w-12 rounded-full mb-3 flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: m.color }}
            aria-hidden
          >
            {m.name[0]}
          </div>
          <div className="font-serif text-lg">{m.name}</div>
          <div className="text-text-muted text-xs uppercase tracking-wide">{m.role}</div>
        </button>
      ))}
    </div>
  );
}
