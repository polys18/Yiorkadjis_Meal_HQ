export type RoundErrorCode =
  | "DUPLICATE_SLOT"
  | "NOT_OPEN"
  | "NOT_CLOSED"
  | "ALREADY_DELETED";

export class RoundError extends Error {
  constructor(public code: RoundErrorCode, message: string) {
    super(message);
    this.name = "RoundError";
  }
}
