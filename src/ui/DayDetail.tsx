import { Sheet } from './Sheet';
import { Mark } from './Mark';
import { dayName, shortDateLabel } from '../domain/dates';
import { statusOf } from '../domain/status';
import type { DateKey } from '../domain/types';
import { activeHabits, entryFor, toggleCheck, today } from '../store/store';

/** Tap-to-edit for one day, reached from any calendar grid. */
export function DayDetail({ date, onClose }: { date: DateKey; onClose: () => void }) {
  const future = date > today.value;
  const habits = activeHabits.value;

  return (
    <Sheet
      title={`${dayName(date, 'long')} ${shortDateLabel(date)}`}
      onClose={onClose}
      hideCancel
      action={{ label: 'Done', onClick: onClose }}
    >
      {future && <p class="notice">This day hasn’t happened yet.</p>}

      {habits.length === 0 ? (
        <p class="hint">No habits had started by this day.</p>
      ) : (
        <ul class="habit-list">
          {habits.map((habit) => {
            const status = statusOf(habit, entryFor(habit.id, date), date, today.value);
            return (
              <li key={habit.id} class="habit-row">
                <button
                  type="button"
                  class="habit-main"
                  disabled={future}
                  aria-pressed={status === 'complete'}
                  onClick={() => void toggleCheck(habit, date)}
                >
                  <Mark shape={habit.shape} color={habit.color} status={status} size={30} />
                  <span class="habit-name">{habit.name}</span>
                  <span class={`habit-value${status === 'complete' ? '' : ' todo'}`}>
                    {future ? '' : status === 'complete' ? 'done' : 'tap to log'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
