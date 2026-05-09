import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRound } from "@/lib/rounds/queries";
import { AppShell } from "@/components/layout/AppShell";
import { RoundDetailClient } from "@/components/rounds/RoundDetailClient";

export const dynamic = "force-dynamic";

export default async function RoundPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const round = await getRound(id);
  if (!round || round.status === "deleted") notFound();

  return (
    <AppShell>
      <RoundDetailClient
        initial={round}
        me={{ id: user.id, role: user.role as "mom" | "kid" }}
      />
    </AppShell>
  );
}
