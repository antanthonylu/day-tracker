import type { DateKey, DayStatus, Entry, Habit } from './types';

/**
 * Whether a day can be logged at all.
 *
 * Only the future is off limits. There are no start dates and no rest-day
 * schedules: both existed to express "this doesn't count today", and both
 * could silently disable every cell a habit had.
 */
export function isApplicable(_habit: Habit, date: DateKey, today: DateKey): boolean {
  return date <= today;
}

/** Done, not done, or still to come. */
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

/** Habits that still belong on the log (not archived), in display order. */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order);
}
