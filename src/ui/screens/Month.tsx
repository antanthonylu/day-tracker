import { useMemo, useState } from 'preact/hooks';
import { MiniMonth } from '../MiniMonth';
import { Mark } from '../Mark';
import { DayDetail } from '../DayDetail';
import { addMonths, monthGrid, monthLabel, startOfMonth, startOfYear } from '../../domain/dates';
import { buildPieData } from '../../domain/pie';
import { monthCompletion } from '../../domain/stats';
import type { DateKey, Habit } from '../../domain/types';
import { WEEK_STARTS_ON } from '../../domain/types';
import { activeHabits, earliestDate, entries, entryFor, today } from '../../store/store';

export function Month() {
  const [anchor, setAnchor] = useState<DateKey>(() => startOfMonth(today.value));
  const [focus, setFocus] = useState<Habit | null>(null);
  const [day, setDay] = useState<DateKey | null>(null);

  const habits = activeHabits.value;
  const atStart = anchor <= startOfMonth(earliestDate.value);

  const pies = useMemo(
    () =>
      focus
        ? undefined
        : buildPieData(habits, monthGrid(anchor, WEEK_STARTS_ON), today.value, entryFor),
    [anchor, focus, habits, entries.value, today.value],
  );

  return (
    <>
      <div class="switcher">
        <button
          type="button"
          aria-label="Previous month"
          disabled={atStart}
          onClick={() => setAnchor((a) => addMonths(a, -1))}
        >
          &#8249;
        </button>
        <button
          type="button"
          class="switcher-label"
          onClick={() => setAnchor(startOfMonth(today.value))}
        >
          <span class="switcher-main">{monthLabel(anchor)}</span>
          <span class="switcher-sub">
            {anchor === startOfMonth(today.value) ? 'This month' : startOfYear(anchor).slice(0, 4)}
          </span>
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setAnchor((a) => addMonths(a, 1))}
        >
          &#8250;
        </button>
      </div>

      {habits.length === 0 ? (
        <div class="placeholder">
          <div class="placeholder-mark" aria-hidden="true" />
          <p>Nothing to show yet.</p>
        </div>
      ) : (
        <>
          <div class="chips">
            <button
              type="button"
              class={`chip${focus ? '' : ' selected'}`}
              onClick={() => setFocus(null)}
            >
              All habits
            </button>
            {habits.map((habit) => (
              <button
                key={habit.id}
                type="button"
                class={`chip${focus?.id === habit.id ? ' selected' : ''}`}
                onClick={() => setFocus(habit)}
              >
                <Mark shape={habit.shape} color={habit.color} status="complete" size={14} />
                {habit.name}
              </button>
            ))}
          </div>

          <MiniMonth
            month={anchor}
            {...(focus ? { habit: focus } : { pies })}
            size="large"
            onPick={setDay}
          />

          <ul class="rank-list">
            {habits
              .map((habit) => ({
                habit,
                stats: monthCompletion(habit, anchor, today.value, entryFor),
              }))
              .sort((a, b) => b.stats.rate - a.stats.rate)
              .map(({ habit, stats }) => (
                <li key={habit.id}>
                  <Mark shape={habit.shape} color={habit.color} status="complete" size={18} />
                  <span class="rank-name">{habit.name}</span>
                  <span class="rank-bar">
                    <span style={{ width: `${stats.rate * 100}%`, background: habit.color }} />
                  </span>
                  <span class="rank-value">{Math.round(stats.rate * 100)}%</span>
                </li>
              ))}
          </ul>
        </>
      )}

      {day && <DayDetail date={day} onClose={() => setDay(null)} />}
    </>
  );
}
