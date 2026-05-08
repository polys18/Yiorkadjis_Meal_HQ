export const ROLES = ["mom", "kid"] as const;
export type Role = (typeof ROLES)[number];

export const MEAL_TYPES = ["lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const ROUND_STATUSES = ["open", "closed", "deleted"] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const AUDIT_ACTIONS = [
  "create_round",
  "vote",
  "change_vote",
  "close_round",
  "reopen_round",
  "delete_round",
  "edit_options",
  "reset_pin",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const FAMILY = [
  { name: "Eleni", role: "mom" as const, color: "#C77D49" },
  { name: "Mary", role: "kid" as const, color: "#D08585" },
  { name: "Polys", role: "kid" as const, color: "#7B8754" },
  { name: "Fotini", role: "kid" as const, color: "#D4A847" },
  { name: "Constantinos", role: "kid" as const, color: "#4A6B7C" },
];

export const COOLDOWN = {
  WINDOW_SECONDS: 60,
  MAX_FAILURES: 5,
  LOCKOUT_SECONDS: 5 * 60,
};

export const MEAL_NAME_MAX = 60;
export const MEAL_NOTE_MAX = 100;
export const HISTORY_DAYS = 30;
