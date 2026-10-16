import { isApplicable, statusOf } from './status';
import type { DateKey, Entry, Habit } from './types';

/** What one day's pie needs to draw itself: how many wedges, and which are filled. */
export interface PieDay {
  total: number;
  colors: string[];
}

/**
 * Precomputes every day's wedges in one pass.
 *
 * Rendering a year means 365 pies. Letting each one re-derive which habits
 * applied that day turned into thousands of repeated calls and a visible
 * stall on opening the Year tab, so the work happens once, here, and the
 * components become dumb.
 */
export function buildPieData(
  habits: Habit[],
  dates: DateKey[],
  today: DateKey,
  lookup: (habitId: string, date: DateKey) => Entry | undefined,
): Map<DateKey, PieDay> {
  const data = new Map<DateKey, PieDay>();

  for (const date of dates) {
    const colors: string[] = [];
    let total = 0;

    for (const habit of habits) {
      if (!isApplicable(habit, date, today)) continue;
      total += 1;
      if (statusOf(habit, lookup(habit.id, date), date, today) === 'complete') {
        colors.push(habit.color);
      }
    }

    data.set(date, { total, colors });
  }

  return data;
}
