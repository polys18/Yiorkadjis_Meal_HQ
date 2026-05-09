"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoundDetail } from "./RoundDetail";
import { CloseRoundModal } from "./CloseRoundModal";
import { EditOptionsModal } from "./EditOptionsModal";
import { ConfettiBurst } from "./ConfettiBurst";
import type { FullRound } from "@/lib/rounds/queries";

export function RoundDetailClient({
  initial,
  me,
}: {
  initial: FullRound;
  me: { id: string; role: "mom" | "kid" };
}) {
  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);
  const [prevStatus, setPrevStatus] = useState(initial.status);
  const router = useRouter();

  useEffect(() => {
    if (prevStatus !== "closed" && initial.status === "closed") {
      setConfettiTick((t) => t + 1);
    }
    setPrevStatus(initial.status);
  }, [initial.status, prevStatus]);

  async function reopen() {
    if (!window.confirm("Reopen this round? Voting will reopen and the cooking decision will be cleared.")) return;
    const res = await fetch(`/api/rounds/${initial.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <>
      <ConfettiBurst trigger={confettiTick} />
      <RoundDetail
        initial={initial}
        me={me}
        onOpenClose={() => setCloseOpen(true)}
        onOpenEdit={() => setEditOpen(true)}
        onReopen={reopen}
      />
      {closeOpen && <CloseRoundModal round={initial} onClose={() => setCloseOpen(false)} />}
      {editOpen && <EditOptionsModal round={initial} onClose={() => setEditOpen(false)} />}
    </>
  );
}
