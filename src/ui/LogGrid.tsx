import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HabitBadge, Mark } from './Mark';
import {
  addMonths,
  dayName,
  dayOfWeek,
  daysOfMonth,
  monthLabel,
  parseDateKey,
  startOfMonth,
} from '../domain/dates';
import { statusOf } from '../domain/status';
import { WEEK_STARTS_ON, type DateKey, type Habit } from '../domain/types';
import { earliestDate, entryFor, toggleCheck, today } from '../store/store';

interface Props {
  habits: Habit[];
  onOpenHabit: (habit: Habit) => void;
}

export function LogGrid({ habits, onOpenHabit }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const todayRow = useRef<HTMLDivElement>(null);
  const thisMonth = startOfMonth(today.value);
  const [month, setMonth] = useState<DateKey>(thisMonth);

  const { year, month: monthNumber } = parseDateKey(month);
  const days = daysOfMonth(year, monthNumber);
  const onThisMonth = month === thisMonth;

  /**
   * Every month from the oldest day worth showing to the end of the current
   * year. A bounded list beats an endless scroll: you can get to December or
   * back to January in one tap instead of flicking past everything between.
   */
  const months = useMemo(() => {
    const list: DateKey[] = [];
    const last = `${parseDateKey(today.value).year}-12-01`;
    for (let m = startOfMonth(earliestDate.value); m <= last; m = addMonths(m, 1)) list.push(m);
    return list;
  }, [earliestDate.value, today.value]);

  // Land on today when the current month is showing, and at the top otherwise.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const row = todayRow.current;
    if (onThisMonth && row) {
      el.scrollTop = row.offsetTop - el.clientHeight / 2 + row.offsetHeight / 2;
    } else {
      el.scrollTop = 0;
    }
  }, [month, onThisMonth]);

  function goToToday() {
    if (month === thisMonth) {
      const el = scroller.current;
      const row = todayRow.current;
      if (el && row) {
        el.scrollTo({
          top: row.offsetTop - el.clientHeight / 2 + row.offsetHeight / 2,
          behavior: 'smooth',
        });
      }
    } else {
      setMonth(thisMonth);
    }
  }

  return (
    <div class="log">
      <div class="log-bar">
        <label class="month-picker">
          <span class="month-picker-label">{monthLabel(month)}</span>
          <ChevronIcon />
          <select
            aria-label="Month"
            value={month}
            onChange={(e) => setMonth((e.target as HTMLSelectElement).value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>

        <button type="button" class="today-button" onClick={goToToday}>
          Today
        </button>
      </div>

      <div class="log-head" style={{ '--cols': habits.length }}>
        <span class="log-corner" />
        {habits.map((habit) => (
          <button
            key={habit.id}
            type="button"
            class="log-col-head"
            aria-label={`${habit.name} details`}
            onClick={() => onOpenHabit(habit)}
          >
            <HabitBadge shape={habit.shape} icon={habit.icon} color={habit.color} />
          </button>
        ))}
      </div>

      <div class="log-scroll" ref={scroller}>
        {days.map((date) => {
          const isToday = date === today.value;
          const future = date > today.value;
          // A dashed rule where each week begins, so runs read as weeks.
          const startsWeek = dayOfWeek(date) === WEEK_STARTS_ON;

          return (
            <div
              key={date}
              data-date={date}
              ref={isToday ? todayRow : undefined}
              class={[
                'log-row',
                isToday ? 'is-today' : '',
                future ? 'is-future' : '',
                startsWeek ? 'week-start' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--cols': habits.length }}
            >
              <div class="log-date">
                <span class="log-day">{String(parseDateKey(date).day).padStart(2, '0')}</span>
                <span class="log-dow">{isToday ? 'TODAY' : dayName(date).toUpperCase()}</span>
              </div>

              {habits.map((habit) => {
                const status = statusOf(habit, entryFor(habit.id, date), date, today.value);
                // Only the future is off limits.
                const locked = future;

                return (
                  <button
                    key={habit.id}
                    type="button"
                    class="log-cell"
                    disabled={locked}
                    aria-pressed={status === 'complete'}
                    aria-label={`${habit.name}, ${dayName(date, 'long')} ${parseDateKey(date).day}`}
                    onClick={() => void toggleCheck(habit, date)}
                  >
                    <Mark shape={habit.shape} color={habit.color} status={status} size={30} />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
