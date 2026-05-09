"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FullRound } from "@/lib/rounds/queries";

export function CloseRoundModal({ round, onClose }: { round: FullRound; onClose: () => void }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function submitClose() {
    if (picked.size === 0) {
      if (!window.confirm("Close without recording what you're cooking?")) return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "close", cookingDecision: Array.from(picked) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not close round");
      return;
    }
    onClose();
    router.refresh();
  }

  const sorted = [...round.options].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-3">
      <div className="bg-surface rounded-card w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
        <h2 className="font-serif text-2xl mb-1">Close & decide</h2>
        <p className="text-text-muted text-sm mb-4">
          Pick what you're cooking — one or two meals.
        </p>
        <ul className="space-y-2 mb-4">
          {sorted.map((o) => (
            <li key={o.id}>
              <label
                className={`flex items-center gap-3 p-3 rounded-btn border cursor-pointer ${
                  picked.has(o.id) ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={picked.has(o.id)}
                  onChange={() => toggle(o.id)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <span className="flex-1">
                  <span className="font-medium">{o.name}</span>
                  {o.note && <span className="text-text-muted text-sm"> — {o.note}</span>}
                </span>
                <span className="font-serif text-xl tabular-nums">{o.votes.length}</span>
              </label>
            </li>
          ))}
        </ul>
        {error && <p className="text-danger text-sm mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-btn text-text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submitClose}
            className="px-4 py-2 rounded-btn bg-primary text-white font-medium disabled:opacity-50"
          >
            {submitting ? "Closing…" : "Confirm — I'm cooking these"}
          </button>
        </div>
      </div>
    </div>
  );
}
