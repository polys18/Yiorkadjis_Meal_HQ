import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/db/client";
import { users, auditLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AppShell } from "@/components/layout/AppShell";
import { AdminClient } from "@/components/admin/AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "mom") redirect("/");

  const members = await db
    .select({ id: users.id, name: users.name, role: users.role, color: users.color })
    .from(users)
    .orderBy(users.name);

  const auditRows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      createdAt: auditLog.createdAt,
      roundId: auditLog.roundId,
      payload: auditLog.payload,
      actorName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.userId))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return (
    <AppShell>
      <h1 className="font-serif text-3xl mb-4">Admin</h1>
      <AdminClient
        members={members}
        audit={auditRows.map((r) => ({
          id: r.id,
          action: r.action,
          createdAt: r.createdAt.toISOString(),
          roundId: r.roundId,
          payload: r.payload,
          actorName: r.actorName,
        }))}
      />
    </AppShell>
  );
}
