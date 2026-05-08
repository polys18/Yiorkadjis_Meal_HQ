import { z } from "zod";
import { MEAL_NAME_MAX, MEAL_NOTE_MAX } from "@/lib/constants";

export const loginSchema = z.object({
  name: z.string().min(1).max(40),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

export const mealOptionInputSchema = z.object({
  name: z.string().trim().min(1).max(MEAL_NAME_MAX),
  note: z.string().trim().max(MEAL_NOTE_MAX).optional().or(z.literal("")),
});

export const createRoundSchema = z.object({
  mealType: z.enum(["lunch", "dinner"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  options: z.array(mealOptionInputSchema).min(1).max(20),
});

export const closeRoundSchema = z.object({
  cookingDecision: z.array(z.string().uuid()).max(20),
});

export const voteSchema = z.object({
  mealOptionId: z.string().uuid(),
});

export const resetPinSchema = z.object({
  userId: z.string().uuid(),
  newPin: z.string().regex(/^\d{4}$/),
});

export const editOptionsSchema = z.object({
  add: z.array(mealOptionInputSchema).optional(),
  remove: z.array(z.string().uuid()).optional(),
});
