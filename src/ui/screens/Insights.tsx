import { useState } from 'preact/hooks';
import { Mark } from '../Mark';
import { HabitDetail } from '../HabitDetail';
import {
  addMonths,
  dayName,
  daysOfMonth,
  monthLabel,
  parseDateKey,
  startOfMonth,
} from '../../domain/dates';
import { statusOf } from '../../domain/status';
import { bestWeekday, monthCompletion } from '../../domain/stats';
import type { DateKey, Habit } from '../../domain/types';
import { activeHabits, earliestDate, entryFor, today } from '../../store/store';

const WEEKDAY_SAMPLES = [
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
  '2026-11-05',
  '2026-11-06',
  '2026-11-07',
];

export function Insights() {
  const [anchor, setAnchor] = useState<DateKey>(() => startOfMonth(today.value));
  const [detail, setDetail] = useState<Habit | null>(null);

  const habits = activeHabits.value;
  const { year, month } = parseDateKey(anchor);
  const days = daysOfMonth(year, month);
  const previous = addMonths(anchor, -1);

  const ranked = habits
    .map((habit) => ({
      habit,
      now: monthCompletion(habit, anchor, today.value, entryFor),
      before: monthCompletion(habit, previous, today.value, entryFor),
    }))
    .sort((a, b) => b.now.rate - a.now.rate);

  const champion = ranked[0];

  return (
    <>
      <div class="switcher">
        <button
          type="button"
          aria-label="Previous month"
          disabled={anchor <= startOfMonth(earliestDate.value)}
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
            {anchor === startOfMonth(today.value) ? 'This month' : 'Insights'}
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
          <p>Insights appear once you have a habit or two.</p>
        </div>
      ) : (
        <>
          {champion && champion.now.done > 0 && (
            <p class="champion">
              <Mark
                shape={champion.habit.shape}
                color={champion.habit.color}
                status="complete"
                size={20}
              />
              <span>
                <strong>{champion.habit.name}</strong> carried the month —{' '}
                {Math.round(champion.now.rate * 100)}% of its days.
              </span>
            </p>
          )}

          <h3 class="section-head">Day by day</h3>
          <div class="heatmap" role="table" aria-label="Habits by day">
            {ranked.map(({ habit }) => (
              <div key={habit.id} class="heat-row" role="row">
                <button
                  type="button"
                  class="heat-label"
                  onClick={() => setDetail(habit)}
                  aria-label={`${habit.name} details`}
                >
                  <Mark shape={habit.shape} color={habit.color} status="complete" size={14} />
                  <span>{habit.name}</span>
                </button>
                <div class="heat-cells">
                  {days.map((date) => {
                    const status = statusOf(habit, entryFor(habit.id, date), date, today.value);
                    return (
                      <span
                        key={date}
                        class={`heat-cell ${status}`}
                        style={status === 'complete' ? { background: habit.color } : undefined}
                        title={`${habit.name} ${date}: ${status}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <h3 class="section-head">Ranked</h3>
          <ul class="rank-list">
            {ranked.map(({ habit, now, before }) => {
              const delta = Math.round((now.rate - before.rate) * 100);
              return (
                <li key={habit.id}>
                  <Mark shape={habit.shape} color={habit.color} status="complete" size={18} />
                  <span class="rank-name">{habit.name}</span>
                  <span class="rank-bar">
                    <span style={{ width: `${now.rate * 100}%`, background: habit.color }} />
                  </span>
                  <span class="rank-value">{Math.round(now.rate * 100)}%</span>
                  <span class={`rank-delta${delta > 0 ? ' up' : delta < 0 ? ' down' : ''}`}>
                    {before.applicable === 0 ? '—' : delta > 0 ? `+${delta}` : delta}
                  </span>
                </li>
              );
            })}
          </ul>

          <h3 class="section-head">Best day of the week</h3>
          <ul class="plain-list">
            {habits.map((habit) => {
              const best = bestWeekday(habit, today.value, entryFor);
              return (
                <li key={habit.id}>
                  <Mark shape={habit.shape} color={habit.color} status="complete" size={14} />
                  <span>{habit.name}</span>
                  <span class="dim">
                    {best
                      ? `${dayName(WEEKDAY_SAMPLES[best.day]!, 'long')} · ${Math.round(best.rate * 100)}%`
                      : 'not enough yet'}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {detail && <HabitDetail habit={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
