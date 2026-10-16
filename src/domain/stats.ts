import { addDays, compareDateKeys, daysOfMonth, parseDateKey, startOfYear } from './dates';
import { isApplicable } from './status';
import type { DateKey, Entry, Habit } from './types';

/** Lookup of 'habitId|date' to entry, which is how the store holds them. */
export type EntryLookup = (habitId: string, date: DateKey) => Entry | undefined;

function done(habit: Habit, date: DateKey, lookup: EntryLookup): boolean {
  return (lookup(habit.id, date)?.value ?? 0) >= 1;
}

/**
 * Consecutive applicable days, ending today, that were done.
 *
 * Today not being done yet does not break the streak -- the day isn't over.
 * The count then ends at yesterday, so a streak only dies once a day you
 * could have acted on has passed unanswered. Non-applicable days are stepped
 * over without counting or breaking, so a weekdays-only habit keeps its run
 * across the weekend.
 */
export function currentStreak(habit: Habit, today: DateKey, lookup: EntryLookup): number {
  let streak = 0;
  let date = today;
  let graceUsed = false;

  while (date >= habit.createdAt) {
    if (isApplicable(habit, date, today)) {
      if (done(habit, date, lookup)) {
        streak += 1;
      } else if (date === today && !graceUsed) {
        // Today is still open; look back from yesterday.
        graceUsed = true;
      } else {
        break;
      }
    }
    date = addDays(date, -1);
  }

  return streak;
}

/** The longest run of done applicable days anywhere in the habit's history. */
export function bestStreak(habit: Habit, today: DateKey, lookup: EntryLookup): number {
  let best = 0;
  let run = 0;

  for (let date = habit.createdAt; date <= today; date = addDays(date, 1)) {
    if (!isApplicable(habit, date, today)) continue;
    if (done(habit, date, lookup)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  return best;
}

export interface Completion {
  done: number;
  applicable: number;
  /** 0..1, or 0 when nothing was applicable. */
  rate: number;
}

/** Done applicable days over applicable days, across an inclusive range. */
export function completion(
  habit: Habit,
  from: DateKey,
  to: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  let applicable = 0;
  let completed = 0;
  const start = compareDateKeys(from, habit.createdAt) < 0 ? habit.createdAt : from;

  for (let date = start; date <= to; date = addDays(date, 1)) {
    if (!isApplicable(habit, date, today)) continue;
    applicable += 1;
    if (done(habit, date, lookup)) completed += 1;
  }

  return {
    done: completed,
    applicable,
    rate: applicable === 0 ? 0 : completed / applicable,
  };
}

export function monthCompletion(
  habit: Habit,
  monthAnchor: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  const { year, month } = parseDateKey(monthAnchor);
  const days = daysOfMonth(year, month);
  return completion(habit, days[0]!, days.at(-1)!, today, lookup);
}

export function yearCompletion(
  habit: Habit,
  yearAnchor: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  const start = startOfYear(yearAnchor);
  return completion(habit, start, `${parseDateKey(start).year}-12-31`, today, lookup);
}

export function allTimeCompletion(habit: Habit, today: DateKey, lookup: EntryLookup): Completion {
  return completion(habit, habit.createdAt, today, today, lookup);
}

/** Total days ever marked done. */
export function totalCompletions(habit: Habit, today: DateKey, lookup: EntryLookup): number {
  return allTimeCompletion(habit, today, lookup).done;
}

/**
 * Completion rate per weekday (index 0 = Sunday), for "you're strongest on
 * Tuesdays". Weekdays the habit never applies to come back as null rather
 * than zero, which would read as failure.
 */
export function byWeekday(habit: Habit, today: DateKey, lookup: EntryLookup): (number | null)[] {
  const tally = Array.from({ length: 7 }, () => ({ done: 0, applicable: 0 }));

  for (let date = habit.createdAt; date <= today; date = addDays(date, 1)) {
    if (!isApplicable(habit, date, today)) continue;
    const slot = tally[new Date(`${date}T12:00:00`).getDay()]!;
    slot.applicable += 1;
    if (done(habit, date, lookup)) slot.done += 1;
  }

  return tally.map((t) => (t.applicable === 0 ? null : t.done / t.applicable));
}

/** The weekday a habit does best on, or null when there isn't enough history. */
export function bestWeekday(
  habit: Habit,
  today: DateKey,
  lookup: EntryLookup,
): { day: number; rate: number } | null {
  const rates = byWeekday(habit, today, lookup);
  let bestDay = -1;
  let bestRate = 0;

  rates.forEach((rate, day) => {
    if (rate === null) return;
    if (bestDay === -1 || rate > bestRate) {
      bestDay = day;
      bestRate = rate;
    }
  });

  return bestDay >= 0 && bestRate > 0 ? { day: bestDay, rate: bestRate } : null;
}
