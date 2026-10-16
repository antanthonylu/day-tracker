import { dayName, isValidDateKey } from '../domain/dates';
import { whyNotApplicable } from '../domain/status';
import type { Habit } from '../domain/types';
import { habits, today } from '../store/store';

const DAY_SAMPLES = [
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
  '2026-11-05',
  '2026-11-06',
  '2026-11-07',
];

const REASONS: Record<string, string> = {
  future: 'that day hasn’t happened',
  'before-start': 'starts later than today',
  archived: 'archived',
  'rest-day': 'today is a rest day',
};

/**
 * What the app actually believes about each habit.
 *
 * A day that can't be logged renders as a disabled control, which is almost
 * indistinguishable from one that simply hasn't been ticked -- so when the
 * answer is "nothing happens when I tap", there was no way to see why. This
 * says so in words.
 */
export function HabitDiagnostics() {
  if (habits.value.length === 0) return null;

  return (
    <>
      <h3 class="section-head">Habit setup</h3>
      <ul class="diag-list">
        {habits.value.map((habit) => (
          <li key={habit.id}>
            <span class="diag-name">{habit.name}</span>
            <span class="diag-row">
              Starts {isValidDateKey(habit.createdAt) ? habit.createdAt : '— not set —'}
            </span>
            <span class="diag-row">Days: {describeSchedule(habit)}</span>
            {habit.archivedAt && <span class="diag-row">Archived {habit.archivedAt}</span>}
            <span class={`diag-row ${loggable(habit) ? 'ok' : 'bad'}`}>
              {loggable(habit)
                ? 'Today can be logged'
                : `Today can’t be logged — ${REASONS[whyNotApplicable(habit, today.value, today.value) ?? ''] ?? 'unknown'}`}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function loggable(habit: Habit): boolean {
  return whyNotApplicable(habit, today.value, today.value) === null;
}

function describeSchedule(habit: Habit): string {
  const days = habit.activeDays;
  if (!Array.isArray(days)) return 'every day';
  if (days.length === 0) return 'NONE — this is the bug';
  if (days.length === 7) return 'every day';
  return days
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .map((d) => dayName(DAY_SAMPLES[d]!))
    .join(', ');
}
