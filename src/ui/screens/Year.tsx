import { useMemo, useState } from 'preact/hooks';
import { YearMonth } from '../YearMonth';
import { Mark } from '../Mark';
import { DayDetail } from '../DayDetail';
import { addDays, monthLabel, parseDateKey, startOfYear } from '../../domain/dates';
import { buildPieData } from '../../domain/pie';
import { yearCompletion } from '../../domain/stats';
import type { DateKey, Habit } from '../../domain/types';
import { activeHabits, earliestDate, entries, entryFor, today } from '../../store/store';

export function Year() {
  const [year, setYear] = useState(() => parseDateKey(today.value).year);
  const [focus, setFocus] = useState<Habit | null>(null);
  const [day, setDay] = useState<DateKey | null>(null);

  const habits = activeHabits.value;
  const earliestYear = parseDateKey(startOfYear(earliestDate.value)).year;

  // Twelve grids is a lot of SVG; recompute them only when the year or the
  // chosen habit actually changes.
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}-01`),
    [year],
  );

  // One pass over the year rather than 365 components each re-deriving the
  // same thing. Keyed on the entry map so a single tap still refreshes it.
  const pies = useMemo(() => {
    if (focus) return undefined;
    const dates: DateKey[] = [];
    for (let d = `${year}-01-01`; d <= `${year}-12-31`; d = addDays(d, 1)) dates.push(d);
    return buildPieData(habits, dates, today.value, entryFor);
  }, [year, focus, habits, entries.value, today.value]);

  return (
    <>
      <div class="switcher">
        <button
          type="button"
          aria-label="Previous year"
          disabled={year <= earliestYear}
          onClick={() => setYear((y) => y - 1)}
        >
          &#8249;
        </button>
        <button
          type="button"
          class="switcher-label"
          onClick={() => setYear(parseDateKey(today.value).year)}
        >
          <span class="switcher-main">{year}</span>
          <span class="switcher-sub">
            {focus ? focus.name : `${habits.length} habit${habits.length === 1 ? '' : 's'}`}
          </span>
        </button>
        <button type="button" aria-label="Next year" onClick={() => setYear((y) => y + 1)}>
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

          {focus && (
            <p class="hint centred">
              {Math.round(yearCompletion(focus, `${year}-06-15`, today.value, entryFor).rate * 100)}
              % of {focus.name} days done in {year}.
            </p>
          )}

          <div class="year-grid">
            {months.map((month) => (
              <section key={month} class="year-month">
                <h3>{monthLabel(month, 'short').split(' ')[0]}</h3>
                <YearMonth
                  month={month}
                  {...(focus ? { habit: focus } : { pies })}
                  onPick={setDay}
                />
              </section>
            ))}
          </div>
        </>
      )}

      {day && <DayDetail date={day} onClose={() => setDay(null)} />}
    </>
  );
}
