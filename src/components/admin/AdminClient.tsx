"use client";
import { useState } from "react";

type FamilyMember = { id: string; name: string; role: string; color: string };
type AuditEntry = {
  id: string;
  action: string;
  createdAt: string;
  actorName: string | null;
  roundId: string | null;
  payload: unknown;
};

export function AdminClient({
  members,
  audit,
}: {
  members: FamilyMember[];
  audit: AuditEntry[];
}) {
  const [target, setTarget] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reset() {
    if (!target || !/^\d{4}$/.test(pin)) {
      setMsg("Pick a person and enter a 4-digit PIN.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/reset-pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: target, newPin: pin }),
    });
    setBusy(false);
    if (res.ok) {
      const name = members.find((m) => m.id === target)?.name ?? "user";
      setMsg(`PIN reset for ${name}.`);
      setTarget(null);
      setPin("");
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Failed");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border bg-surface shadow-card p-4">
        <h2 className="font-serif text-xl mb-3">Reset PIN</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setTarget(m.id)}
              className={`px-3 py-2 rounded-btn border text-left ${
                target === m.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span
                className="inline-block h-5 w-5 rounded-full mr-2 align-middle"
                style={{ backgroundColor: m.color }}
              />
              {m.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="New 4-digit PIN"
            inputMode="numeric"
            className="px-3 py-2 rounded-btn border border-border bg-surface"
          />
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="px-4 py-2 rounded-btn bg-primary text-white font-medium disabled:opacity-50"
          >
            Reset
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-text-muted">{msg}</p>}
      </section>

      <section className="rounded-card border border-border bg-surface shadow-card p-4">
        <h2 className="font-serif text-xl mb-3">Recent activity</h2>
        {audit.length === 0 ? (
          <p className="text-text-muted text-sm">No activity yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {audit.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between">
                <span>
                  <span className="font-medium">{e.actorName ?? "system"}</span>{" "}
                  <span className="text-text-muted">{e.action}</span>
                </span>
                <span className="text-text-muted text-xs">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
