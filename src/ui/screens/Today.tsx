import { useState } from 'preact/hooks';
import { Mark } from '../Mark';
import { HabitSheet } from '../HabitSheet';
import { WeekStrip } from '../WeekStrip';
import { DateSwitcher } from '../DateSwitcher';
import { addDays, clampDateKey } from '../../domain/dates';
import { fillFraction, isApplicable, statusOf } from '../../domain/status';
import { stepOf, targetOf, type DateKey, type Habit } from '../../domain/types';
import {
  activeHabits,
  bumpCount,
  earliestDate,
  entryFor,
  toggleCheck,
  today,
} from '../../store/store';

export function Today() {
  const [picked, setPicked] = useState<DateKey | null>(null);
  const [adding, setAdding] = useState(false);

  const selected = picked ?? today.value;
  const isFuture = selected > today.value;
  const started = activeHabits.value.filter((h) => h.createdAt <= selected);

  // Stepping from the previous state rather than from `selected` means five
  // quick taps move five days; closing over the rendered value would collapse
  // them into one.
  const step = (days: number) =>
    setPicked((current) =>
      clampDateKey(addDays(current ?? today.value, days), earliestDate.value, '9999-12-31'),
    );

  return (
    <>
      <DateSwitcher value={selected} onStep={step} onToday={() => setPicked(today.value)} />
      <WeekStrip selected={selected} onSelect={setPicked} />

      {isFuture && (
        <p class="notice">
          This day hasn&rsquo;t happened yet. You can look ahead, but logging waits for the day.
        </p>
      )}

      {started.length === 0 ? (
        <div class="placeholder">
          <div class="placeholder-mark" aria-hidden="true" />
          <p>
            {activeHabits.value.length === 0
              ? 'No habits yet. Add one below.'
              : 'No habits had started by this day.'}
          </p>
        </div>
      ) : (
        <ul class="habit-list">
          {started.map((habit) => (
            <HabitRow key={habit.id} habit={habit} date={selected} frozen={isFuture} />
          ))}
        </ul>
      )}

      <button type="button" class="add-button" onClick={() => setAdding(true)}>
        + New habit
      </button>

      {adding && <HabitSheet onClose={() => setAdding(false)} />}
    </>
  );
}

function HabitRow({ habit, date, frozen }: { habit: Habit; date: DateKey; frozen: boolean }) {
  const entry = entryFor(habit.id, date);
  const status = statusOf(habit, entry, date, today.value);
  // A day off the schedule is shown but inert -- it is a rest day, not a miss.
  const restDay = !frozen && !isApplicable(habit, date, today.value);
  const locked = frozen || restDay;
  const value = entry?.value ?? 0;

  const mark = (
    <Mark
      shape={habit.shape}
      color={habit.color}
      status={status}
      fill={fillFraction(habit, entry)}
      size={34}
      isToday={date === today.value}
    />
  );

  if (habit.kind === 'count') {
    const target = targetOf(habit);
    return (
      <li class={`habit-row${restDay ? ' rest' : ''}`}>
        <button
          type="button"
          class="habit-main"
          disabled={locked}
          onClick={() => void bumpCount(habit, date, 1)}
        >
          {mark}
          <span class="habit-name">{habit.name}</span>
          <span class="habit-value">
            {restDay ? 'rest day' : `${value}/${target}${habit.unit ? ` ${habit.unit}` : ''}`}
          </span>
        </button>
        {!restDay && (
          <div class="counter">
            <button
              type="button"
              aria-label={`Subtract ${stepOf(habit)} from ${habit.name}`}
              disabled={locked || value <= 0}
              onClick={() => void bumpCount(habit, date, -1)}
            >
              &minus;
            </button>
            <button
              type="button"
              aria-label={`Add ${stepOf(habit)} to ${habit.name}`}
              disabled={locked}
              onClick={() => void bumpCount(habit, date, 1)}
            >
              +
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <li class={`habit-row${restDay ? ' rest' : ''}`}>
      <button
        type="button"
        class="habit-main"
        disabled={locked}
        aria-pressed={status === 'complete'}
        onClick={() => void toggleCheck(habit, date)}
      >
        {mark}
        <span class="habit-name">{habit.name}</span>
        <span class="habit-value">
          {restDay ? 'rest day' : status === 'complete' ? 'done' : ''}
        </span>
      </button>
    </li>
  );
}
