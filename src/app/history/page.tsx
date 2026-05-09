import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listHistory } from "@/lib/rounds/queries";
import { formatRoundDate } from "@/lib/date";
import { AppShell } from "@/components/layout/AppShell";
import { VoterChip } from "@/components/family/VoterChip";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rounds = await listHistory();

  return (
    <AppShell>
      <h1 className="font-serif text-3xl mb-4">History</h1>
      {rounds.length === 0 ? (
        <p className="text-text-muted">No closed rounds yet.</p>
      ) : (
        <ul className="space-y-3">
          {rounds.map((r) => {
            const cooking = r.options.filter((o) => (r.cookingDecision ?? []).includes(o.id));
            return (
              <li
                key={r.id}
                className="rounded-card border border-border bg-surface shadow-card p-4"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-text-muted text-xs uppercase tracking-wider capitalize">
                      {r.mealType}
                    </div>
                    <div className="font-serif text-lg">{formatRoundDate(r.date)}</div>
                  </div>
                </div>
                {cooking.length > 0 ? (
                  <p className="text-sm">
                    <strong>Cooked:</strong>{" "}
                    {cooking.map((o) => o.name).join(" + ")}
                  </p>
                ) : (
                  <p className="text-text-muted text-sm">No cooking decision recorded.</p>
                )}
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-text-muted">Vote breakdown</summary>
                  <ul className="mt-2 space-y-1">
                    {r.options.map((o) => (
                      <li key={o.id} className="flex items-center justify-between">
                        <span>{o.name}</span>
                        <span className="flex items-center gap-1">
                          {o.votes.map((v) => (
                            <VoterChip key={v.id} name={v.userName} color={v.userColor} />
                          ))}
                          <span className="text-text-muted ml-1 tabular-nums">
                            {o.votes.length}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
