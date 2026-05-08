"use client";
import { useState } from "react";

export function PinKeypad({
  name,
  onCancel,
  onSubmit,
}: {
  name: string;
  onCancel: () => void;
  onSubmit: (pin: string) => Promise<string | null>; // returns error message or null
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(value: string) {
    setLoading(true);
    setError(null);
    const err = await onSubmit(value);
    setLoading(false);
    if (err) {
      setError(err);
      setPin("");
    }
  }

  function press(d: string) {
    if (loading) return;
    setError(null);
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) void handleSubmit(next);
    }
  }

  function backspace() {
    if (loading) return;
    setError(null);
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div>
        <div className="text-text-muted text-sm uppercase tracking-wider">Hello,</div>
        <div className="font-serif text-3xl">{name}</div>
      </div>
      <div className="flex gap-3" aria-label={`PIN, ${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length ? "bg-primary border-primary" : "border-border"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-danger text-sm">{error}</p>}
      <div className="grid grid-cols-3 gap-3 w-64">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="h-16 rounded-btn bg-surface border border-border shadow-card text-2xl font-medium active:scale-95 active:bg-surface-2"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={onCancel}
          className="h-16 rounded-btn text-sm text-text-muted active:scale-95"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => press("0")}
          className="h-16 rounded-btn bg-surface border border-border shadow-card text-2xl font-medium active:scale-95 active:bg-surface-2"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          className="h-16 rounded-btn text-sm text-text-muted active:scale-95"
        >
          ←
        </button>
      </div>
    </div>
  );
}
