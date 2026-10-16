import { dayOfWeek, isValidDateKey } from './dates';
import type { DateKey, DayStatus, Entry, Habit } from './types';

/**
 * The schedule, defensively.
 *
 * A habit with no usable schedule means "every day", never "no days". There
 * is no way to deliberately create an empty schedule -- the editor refuses to
 * save one -- so an empty or malformed list is always corruption, and reading
 * it literally makes every single cell non-applicable, which disables every
 * button and leaves tapping a day doing nothing at all.
 */
function scheduleOf(habit: Habit): number[] | null {
  const days = habit.activeDays;
  if (!Array.isArray(days) || days.length === 0) return null;
  const valid = days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return valid.length === 0 ? null : valid;
}

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
  // A missing or malformed start date must not hide the habit entirely.
  if (isValidDateKey(habit.createdAt) && date < habit.createdAt) return false;
  if (date > today) return false;
  if (habit.archivedAt && isValidDateKey(habit.archivedAt) && date >= habit.archivedAt) {
    return false;
  }
  const schedule = scheduleOf(habit);
  if (schedule && !schedule.includes(dayOfWeek(date))) return false;
  return true;
}

/** Why a day can't be logged, for showing the user instead of a dead button. */
export function whyNotApplicable(
  habit: Habit,
  date: DateKey,
  today: DateKey,
): 'future' | 'before-start' | 'archived' | 'rest-day' | null {
  if (date > today) return 'future';
  if (isValidDateKey(habit.createdAt) && date < habit.createdAt) return 'before-start';
  if (habit.archivedAt && isValidDateKey(habit.archivedAt) && date >= habit.archivedAt) {
    return 'archived';
  }
  const schedule = scheduleOf(habit);
  if (schedule && !schedule.includes(dayOfWeek(date))) return 'rest-day';
  return null;
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
