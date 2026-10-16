import { dayOfWeek } from './dates';
import type { DateKey, DayStatus, Entry, Habit } from './types';
import { targetOf } from './types';

/**
 * Whether a habit is answerable on a day at all.
 *
 * A day you were never meant to do the habit -- before you created it, after
 * you archived it, a rest day, or a day that hasn't happened yet -- is "not
 * applicable". That is deliberately distinct from "missed": na days are left
 * out of completion rates and step over streaks without breaking them, so a
 * weekdays-only habit isn't punished every Saturday.
 */
export function isApplicable(habit: Habit, date: DateKey, today: DateKey): boolean {
  if (date < habit.createdAt) return false;
  if (date > today) return false;
  if (habit.archivedAt && date >= habit.archivedAt) return false;
  if (habit.activeDays && !habit.activeDays.includes(dayOfWeek(date))) return false;
  return true;
}

/** How a habit stands on one day. */
export function statusOf(
  habit: Habit,
  entry: Entry | undefined,
  date: DateKey,
  today: DateKey,
): DayStatus {
  if (!isApplicable(habit, date, today)) return 'na';
  const value = entry?.value ?? 0;
  if (value >= targetOf(habit)) return 'complete';
  if (value > 0) return 'partial';
  return 'missed';
}

/**
 * How full the mark should be drawn, 0..1.
 *
 * Check habits are all or nothing; count habits fill like a glass so progress
 * is legible before the day is done.
 */
export function fillFraction(habit: Habit, entry: Entry | undefined): number {
  const value = entry?.value ?? 0;
  if (value <= 0) return 0;
  const target = targetOf(habit);
  return Math.min(1, value / target);
}

/** Active habits for a day, in display order. */
export function habitsForDay(habits: Habit[], date: DateKey, today: DateKey): Habit[] {
  return habits.filter((h) => isApplicable(h, date, today)).sort((a, b) => a.order - b.order);
}

/** Habits that still belong on the Today list (not archived). */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order);
}
