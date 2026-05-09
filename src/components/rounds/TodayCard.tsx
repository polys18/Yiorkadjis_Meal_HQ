import Link from "next/link";
import { VoterChip } from "@/components/family/VoterChip";
import type { FullRound } from "@/lib/rounds/queries";
import type { MealType } from "@/lib/constants";

export function TodayCard({
  meal,
  round,
  isMom,
}: {
  meal: MealType;
  round: FullRound | null;
  isMom: boolean;
}) {
  const title = meal === "lunch" ? "Lunch" : "Dinner";

  if (!round) {
    return (
      <section className="rounded-card border border-border bg-surface shadow-card p-5">
        <div className="text-text-muted text-xs uppercase tracking-wider mb-1">{title}</div>
        <div className="font-serif text-xl mb-3">No round yet</div>
        {isMom ? (
          <Link
            href={`/round/new?meal=${meal}`}
            className="inline-block px-4 py-2 rounded-btn bg-primary text-white text-sm font-medium active:scale-95"
          >
            + Add {meal} options
          </Link>
        ) : (
          <p className="text-text-muted text-sm">Eleni hasn't added options yet.</p>
        )}
      </section>
    );
  }

  if (round.status === "open") {
    const top = [...round.options].sort((a, b) => b.votes.length - a.votes.length)[0];
    return (
      <section className="rounded-card border border-border bg-surface shadow-card p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-text-muted text-xs uppercase tracking-wider">{title}</div>
            <div className="font-serif text-xl">Voting open</div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success">Open</span>
        </div>
        {top && top.votes.length > 0 && (
          <p className="text-sm text-text-muted mb-3">
            Leading: <span className="text-text font-medium">{top.name}</span> ({top.votes.length} {top.votes.length === 1 ? "vote" : "votes"})
          </p>
        )}
        <Link
          href={`/round/${round.id}`}
          className="inline-block px-4 py-2 rounded-btn bg-primary text-white text-sm font-medium active:scale-95"
        >
          Tap to vote
        </Link>
      </section>
    );
  }

  // closed
  const cookingIds = round.cookingDecision ?? [];
  const cooking = round.options.filter((o) => cookingIds.includes(o.id));
  return (
    <section className="rounded-card border border-border bg-surface shadow-card p-5 opacity-95">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-text-muted text-xs uppercase tracking-wider">{title}</div>
          <div className="font-serif text-xl">Cooking</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-surface-2 text-text-muted">Closed</span>
      </div>
      {cooking.length > 0 ? (
        <ul className="space-y-1 mb-3">
          {cooking.map((o) => (
            <li key={o.id} className="font-medium">
              {o.name}
              {o.note ? <span className="text-text-muted text-sm"> — {o.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted text-sm mb-3">No cooking decision recorded.</p>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-text-muted">Show vote breakdown</summary>
        <ul className="mt-2 space-y-1">
          {round.options.map((o) => (
            <li key={o.id} className="flex items-center justify-between">
              <span>{o.name}</span>
              <span className="flex items-center gap-1">
                {o.votes.map((v) => (
                  <VoterChip key={v.id} name={v.userName} color={v.userColor} />
                ))}
                <span className="text-text-muted ml-1 tabular-nums">{o.votes.length}</span>
              </span>
            </li>
          ))}
        </ul>
      </details>
      <Link href={`/round/${round.id}`} className="text-sm text-primary mt-3 inline-block">
        View round →
      </Link>
    </section>
  );
}
