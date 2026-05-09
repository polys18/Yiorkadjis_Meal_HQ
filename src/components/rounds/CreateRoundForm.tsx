"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEAL_NAME_MAX, MEAL_NOTE_MAX } from "@/lib/constants";

type Option = { name: string; note: string };

export function CreateRoundForm({ mealType, dateISO }: { mealType: "lunch" | "dinner"; dateISO: string }) {
  const router = useRouter();
  const [options, setOptions] = useState<Option[]>([{ name: "", note: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Option>) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  function add() {
    setOptions((opts) => [...opts, { name: "", note: "" }]);
  }

  function remove(i: number) {
    setOptions((opts) => opts.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = options
      .map((o) => ({ name: o.name.trim(), note: o.note.trim() || undefined }))
      .filter((o) => o.name.length > 0);
    if (cleaned.length === 0) {
      setError("Add at least one meal option.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mealType, date: dateISO, options: cleaned }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create round");
      return;
    }
    const data = await res.json();
    router.replace(`/round/${data.round.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-serif text-3xl capitalize">New {mealType} round</h1>
      <p className="text-text-muted text-sm">Add meal options for today.</p>

      <ul className="space-y-3">
        {options.map((o, i) => (
          <li key={i} className="rounded-card border border-border bg-surface shadow-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={o.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Meal name"
                maxLength={MEAL_NAME_MAX}
                className="flex-1 px-3 py-2 rounded-btn border border-border bg-surface"
                aria-label={`Option ${i + 1} name`}
              />
              {options.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="px-3 py-2 text-sm text-text-muted hover:text-danger"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              value={o.note}
              onChange={(e) => update(i, { note: e.target.value })}
              placeholder="Optional note (e.g., extra béchamel)"
              maxLength={MEAL_NOTE_MAX}
              className="w-full px-3 py-2 rounded-btn border border-border bg-surface text-sm"
              aria-label={`Option ${i + 1} note`}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="text-sm text-primary"
      >
        + Add another option
      </button>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-btn bg-primary text-white font-medium disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Open round"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded-btn text-text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
