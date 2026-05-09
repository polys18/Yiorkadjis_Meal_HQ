import Link from "next/link";
import type { FullRound } from "@/lib/rounds/queries";

export function StaleRoundBanner({ rounds }: { rounds: FullRound[] }) {
  if (rounds.length === 0) return null;
  return (
    <div className="mb-4 rounded-card bg-surface-2 border border-border p-3 text-sm">
      <strong className="font-serif">Yesterday's rounds still open:</strong>
      <ul className="mt-1 space-y-1">
        {rounds.map((r) => (
          <li key={r.id} className="flex items-center justify-between">
            <span className="capitalize">{r.mealType}</span>
            <Link href={`/round/${r.id}`} className="text-primary">
              Close it →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
