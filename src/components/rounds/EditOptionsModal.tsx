"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FullRound } from "@/lib/rounds/queries";
import { MEAL_NAME_MAX, MEAL_NOTE_MAX } from "@/lib/constants";

export function EditOptionsModal({ round, onClose }: { round: FullRound; onClose: () => void }) {
  const router = useRouter();
  const [toRemove, setToRemove] = useState<Set<string>>(new Set());
  const [toAdd, setToAdd] = useState<{ name: string; note: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    for (const id of toRemove) {
      const opt = round.options.find((o) => o.id === id);
      if (opt && opt.votes.length > 0) {
        if (
          !window.confirm(
            `${opt.votes.length} ${opt.votes.length === 1 ? "person" : "people"} voted for ${opt.name}. Remove anyway?`
          )
        )
          return;
      }
    }
    setSubmitting(true);
    setError(null);
    const cleanedAdd = toAdd
      .map((o) => ({ name: o.name.trim(), note: o.note.trim() || undefined }))
      .filter((o) => o.name.length > 0);
    const res = await fetch(`/api/rounds/${round.id}/options`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ add: cleanedAdd, remove: Array.from(toRemove) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-3">
      <div className="bg-surface rounded-card w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
        <h2 className="font-serif text-2xl mb-3">Edit options</h2>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-text-muted">Existing</p>
          {round.options.map((o) => (
            <label key={o.id} className="flex items-center gap-3 p-2 border-b border-border">
              <input
                type="checkbox"
                checked={toRemove.has(o.id)}
                onChange={() =>
                  setToRemove((s) => {
                    const n = new Set(s);
                    n.has(o.id) ? n.delete(o.id) : n.add(o.id);
                    return n;
                  })
                }
              />
              <span className={`flex-1 ${toRemove.has(o.id) ? "line-through text-text-muted" : ""}`}>
                {o.name}
                {o.note && <span className="text-text-muted text-sm"> — {o.note}</span>}
              </span>
              <span className="text-sm text-text-muted tabular-nums">{o.votes.length}v</span>
            </label>
          ))}
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-text-muted">Add</p>
          {toAdd.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={o.name}
                onChange={(e) =>
                  setToAdd((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                }
                maxLength={MEAL_NAME_MAX}
                placeholder="Name"
                className="flex-1 px-3 py-2 rounded-btn border border-border bg-surface"
              />
              <input
                value={o.note}
                onChange={(e) =>
                  setToAdd((arr) => arr.map((x, idx) => (idx === i ? { ...x, note: e.target.value } : x)))
                }
                maxLength={MEAL_NOTE_MAX}
                placeholder="Note"
                className="w-32 px-3 py-2 rounded-btn border border-border bg-surface"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setToAdd((arr) => [...arr, { name: "", note: "" }])}
            className="text-sm text-primary"
          >
            + Add option
          </button>
        </div>

        {error && <p className="text-danger text-sm mb-2">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-btn text-text-muted">
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={save}
            className="px-4 py-2 rounded-btn bg-primary text-white font-medium disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
