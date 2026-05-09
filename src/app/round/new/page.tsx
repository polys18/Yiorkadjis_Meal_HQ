import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { todayISO } from "@/lib/date";
import { AppShell } from "@/components/layout/AppShell";
import { CreateRoundForm } from "@/components/rounds/CreateRoundForm";

export const dynamic = "force-dynamic";

export default async function NewRoundPage({
  searchParams,
}: {
  searchParams: Promise<{ meal?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "mom") redirect("/");

  const { meal } = await searchParams;
  const mealType = meal === "lunch" ? "lunch" : "dinner";

  return (
    <AppShell>
      <CreateRoundForm mealType={mealType} dateISO={todayISO()} />
    </AppShell>
  );
}
