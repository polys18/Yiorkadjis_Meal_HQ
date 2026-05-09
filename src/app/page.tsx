import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getTodayRounds, listOpenRoundsForBanner } from "@/lib/rounds/queries";
import { todayISO, yesterdayISO } from "@/lib/date";
import { AppShell } from "@/components/layout/AppShell";
import { TodayCard } from "@/components/rounds/TodayCard";
import { StaleRoundBanner } from "@/components/layout/StaleRoundBanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayISO();
  const yesterday = yesterdayISO();
  const [{ lunch, dinner }, stale] = await Promise.all([
    getTodayRounds(today),
    listOpenRoundsForBanner(yesterday),
  ]);
  const isMom = user.role === "mom";

  return (
    <AppShell>
      <StaleRoundBanner rounds={stale} />
      <h1 className="font-serif text-3xl mb-4">Today</h1>
      <div className="space-y-4">
        <TodayCard meal="lunch" round={lunch} isMom={isMom} />
        <TodayCard meal="dinner" round={dinner} isMom={isMom} />
      </div>
    </AppShell>
  );
}
