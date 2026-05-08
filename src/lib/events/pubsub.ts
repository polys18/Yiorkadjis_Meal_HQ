import { EventEmitter } from "node:events";

const globalForBus = globalThis as unknown as { _bus?: EventEmitter };
const bus = globalForBus._bus ?? new EventEmitter();
bus.setMaxListeners(50);
if (process.env.NODE_ENV !== "production") globalForBus._bus = bus;

export type RoundEvent =
  | { type: "vote-changed"; roundId: string }
  | { type: "round-closed"; roundId: string }
  | { type: "round-reopened"; roundId: string }
  | { type: "options-edited"; roundId: string };

export function publishRoundEvent(ev: RoundEvent): void {
  bus.emit(`round:${ev.roundId}`, ev);
}

export function subscribeToRound(roundId: string, handler: (ev: RoundEvent) => void): () => void {
  bus.on(`round:${roundId}`, handler);
  return () => bus.off(`round:${roundId}`, handler);
}
