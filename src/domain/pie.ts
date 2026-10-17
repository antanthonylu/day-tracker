import { isApplicable, statusOf } from './status';
import type { DateKey, Entry, Habit } from './types';

/**
 * One day's wedges.
 *
 * `slots` has one entry per habit, always in the habits' own order: the colour
 * when that habit was done, null when it wasn't. The index carries the
 * meaning, so a habit owns the same slice of the circle on every day of every
 * month -- the first of three habits is always the top-right third, whether or
 * not the other two happened. Packing only the completed colours would slide
 * each habit around depending on its neighbours, which makes a grid of days
 * impossible to read at a glance.
 */
export interface PieDay {
  total: number;
  slots: (string | null)[];
}

export function buildPieData(
  habits: Habit[],
  dates: DateKey[],
  today: DateKey,
  lookup: (habitId: string, date: DateKey) => Entry | undefined,
): Map<DateKey, PieDay> {
  const data = new Map<DateKey, PieDay>();

  for (const date of dates) {
    const slots = habits.map((habit) =>
      isApplicable(habit, date, today) &&
      statusOf(habit, lookup(habit.id, date), date, today) === 'complete'
        ? habit.color
        : null,
    );
    data.set(date, { total: habits.length, slots });
  }

  return data;
}
