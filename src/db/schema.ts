import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  role: text("role").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rounds = pgTable(
  "rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mealType: text("meal_type").notNull(),
    date: date("date").notNull(),
    status: text("status").notNull(),
    openedBy: uuid("opened_by").notNull().references(() => users.id),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    cookingDecision: jsonb("cooking_decision").$type<string[] | null>(),
  },
  (t) => ({
    activeSlot: uniqueIndex("rounds_active_slot_uq")
      .on(t.date, t.mealType)
      .where(sql`status <> 'deleted'`),
  })
);

export const mealOptions = pgTable("meal_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  note: text("note"),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
    mealOptionId: uuid("meal_option_id")
      .notNull()
      .references(() => mealOptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    oneVotePerUserPerRound: uniqueIndex("votes_round_user_uq").on(t.roundId, t.userId),
  })
);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  roundId: uuid("round_id").references(() => rounds.id),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  successful: boolean("successful").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type MealOption = typeof mealOptions.$inferSelect;
export type Vote = typeof votes.$inferSelect;
