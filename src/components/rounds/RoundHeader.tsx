import { formatRoundDate } from "@/lib/date";

export function RoundHeader({
  date,
  mealType,
  status,
}: {
  date: string;
  mealType: "lunch" | "dinner";
  status: "open" | "closed" | "deleted";
}) {
  const pillCls =
    status === "open"
      ? "bg-success/15 text-success"
      : status === "closed"
      ? "bg-surface-2 text-text-muted"
      : "bg-danger/15 text-danger";
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h1 className="font-serif text-3xl capitalize">
        {mealType} · <span className="text-text-muted">{formatRoundDate(date)}</span>
      </h1>
      <span className={`text-xs px-2 py-1 rounded-full ${pillCls}`}>
        {status === "open" ? "Open" : status === "closed" ? "Closed" : "Deleted"}
      </span>
    </div>
  );
}
