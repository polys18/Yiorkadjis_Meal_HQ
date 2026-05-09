"use client";
import type { FullRound } from "@/lib/rounds/queries";
export function CloseRoundModal({ round: _round, onClose }: { round: FullRound; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-surface rounded-card w-full max-w-md p-5">
        <p>Closing UI coming next task.</p>
        <button onClick={onClose} className="mt-3 text-primary text-sm">Cancel</button>
      </div>
    </div>
  );
}
