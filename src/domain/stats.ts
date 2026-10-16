import { addDays, dayOfWeek } from './dates';
import type { DateKey, Entry, Habit } from './types';

/** Lookup of 'habitId|date' to entry, which is how the store holds them. */
export type EntryLookup = (habitId: string, date: DateKey) => Entry | undefined;

function done(habit: Habit, date: DateKey, lookup: EntryLookup): boolean {
  return (lookup(habit.id, date)?.value ?? 0) >= 1;
}

export interface Completion {
  done: number;
  /** Days in the period that had already happened. */
  days: number;
  /** 0..1, or 0 when the period hasn't started. */
  rate: number;
}

/**
 * Days done over days elapsed, across an inclusive range.
 *
 * Every past day counts. There is no schedule to exempt a day and no start
 * date to begin from, so the denominator is simply how much of the period has
 * happened -- which is also what makes the number comparable between habits.
 */
export function completion(
  habit: Habit,
  from: DateKey,
  to: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  const end = to > today ? today : to;
  let days = 0;
  let completed = 0;

  for (let date = from; date <= end; date = addDays(date, 1)) {
    days += 1;
    if (done(habit, date, lookup)) completed += 1;
  }

  return { done: completed, days, rate: days === 0 ? 0 : completed / days };
}

export function monthCompletion(
  habit: Habit,
  monthAnchor: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  const [year, month] = [monthAnchor.slice(0, 4), monthAnchor.slice(5, 7)];
  const first = `${year}-${month}-01`;
  const last = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;
  return completion(habit, first, last, today, lookup);
}

export function yearCompletion(
  habit: Habit,
  yearAnchor: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  const year = yearAnchor.slice(0, 4);
  return completion(habit, `${year}-01-01`, `${year}-12-31`, today, lookup);
}

/** Every day on record, from `from` up to today. */
export function allTimeCompletion(
  habit: Habit,
  from: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Completion {
  return completion(habit, from, today, today, lookup);
}

/**
 * Completion rate per weekday (index 0 = Sunday), for "you're strongest on
 * Tuesdays". A weekday with no elapsed days yet comes back as null rather
 * than zero, which would read as failure.
 */
export function byWeekday(
  habit: Habit,
  from: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): (number | null)[] {
  const tally = Array.from({ length: 7 }, () => ({ done: 0, days: 0 }));

  for (let date = from; date <= today; date = addDays(date, 1)) {
    const slot = tally[dayOfWeek(date)]!;
    slot.days += 1;
    if (done(habit, date, lookup)) slot.done += 1;
  }

  return tally.map((t) => (t.days === 0 ? null : t.done / t.days));
}

/** The weekday a habit does best on, or null when there isn't enough history. */
export function bestWeekday(
  habit: Habit,
  from: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): { day: number; rate: number } | null {
  const rates = byWeekday(habit, from, today, lookup);
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
