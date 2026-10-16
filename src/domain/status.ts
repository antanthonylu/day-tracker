import { dayOfWeek } from './dates';
import type { DateKey, DayStatus, Entry, Habit } from './types';

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

/** Done, not done, or never asked. */
export function statusOf(
  habit: Habit,
  entry: Entry | undefined,
  date: DateKey,
  today: DateKey,
): DayStatus {
  if (!isApplicable(habit, date, today)) return 'na';
  return (entry?.value ?? 0) >= 1 ? 'complete' : 'missed';
}

export function isDone(entry: Entry | undefined): boolean {
  return (entry?.value ?? 0) >= 1;
}

/** Active habits for a day, in display order. */
export function habitsForDay(habits: Habit[], date: DateKey, today: DateKey): Habit[] {
  return habits.filter((h) => isApplicable(h, date, today)).sort((a, b) => a.order - b.order);
}

/** Habits that still belong on the Today list (not archived). */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order);
}
