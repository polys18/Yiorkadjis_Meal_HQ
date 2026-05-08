import { db } from "@/db/client";
import { auditLog } from "@/db/schema";
import type { AuditAction } from "@/lib/constants";

export async function writeAudit(params: {
  userId: string;
  action: AuditAction;
  roundId?: string | null;
  payload?: unknown;
}): Promise<void> {
  await db.insert(auditLog).values({
    userId: params.userId,
    action: params.action,
    roundId: params.roundId ?? null,
    payload: params.payload ? (params.payload as object) : null,
  });
}
