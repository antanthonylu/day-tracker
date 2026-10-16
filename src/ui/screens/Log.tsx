import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Mark } from '../Mark';
import { HabitSheet } from '../HabitSheet';
import { HabitDetail } from '../HabitDetail';
import { addDays, dayName, dayOfWeek, monthLabel, parseDateKey } from '../../domain/dates';
import { isApplicable, statusOf } from '../../domain/status';
import { WEEK_STARTS_ON, type DateKey, type Habit } from '../../domain/types';
import { activeHabits, earliestDate, entryFor, toggleCheck, today } from '../../store/store';

/** Days of future shown below today, so tomorrow is visible but inert. */
const FUTURE_DAYS = 3;
/** Days loaded above the viewport before older ones are fetched in. */
const PAGE = 60;

export function Log() {
  const habits = activeHabits.value;
  const scroller = useRef<HTMLDivElement>(null);
  const todayRow = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Habit | null>(null);
  const [earliestShown, setEarliestShown] = useState(() => addDays(today.value, -PAGE));
  const [visibleMonth, setVisibleMonth] = useState(today.value);

  const start = earliestShown < earliestDate.value ? earliestDate.value : earliestShown;
  const end = addDays(today.value, FUTURE_DAYS);

  const days: DateKey[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  // Open on today rather than at the top of the list: the day you want is
  // almost always the one you're on.
  //
  // Set scrollTop directly rather than calling scrollIntoView, which walks up
  // and scrolls every ancestor as well -- that pushed the sticky habit header
  // off the top of the screen.
  useLayoutEffect(() => {
    const el = scroller.current;
    const row = todayRow.current;
    if (!el || !row) return;
    el.scrollTop = row.offsetTop - el.clientHeight / 2 + row.offsetHeight / 2;
  }, []);

  // Older days load as you reach the top, so the list feels endless without
  // rendering five years of rows up front.
  //
  // The handler runs on every scroll frame, so it must not touch layout:
  // measuring each row with getBoundingClientRect was forcing a reflow per
  // frame and pushing the worst frames near a second. Rows are a uniform
  // height, so the month on screen is arithmetic instead.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    let queued = false;
    let loading = false;

    const read = () => {
      queued = false;

      if (!loading && el.scrollTop < 240 && start > earliestDate.value) {
        loading = true;
        const previousHeight = el.scrollHeight;
        setEarliestShown((current) => addDays(current, -PAGE));
        requestAnimationFrame(() => {
          // Hold the eye where it was instead of teleporting to the new top.
          el.scrollTop += el.scrollHeight - previousHeight;
          loading = false;
        });
      }

      const first = el.querySelector<HTMLElement>('[data-date]');
      if (!first) return;
      const rowHeight = first.offsetHeight || 1;
      const index = Math.min(days.length - 1, Math.floor((el.scrollTop + 80) / rowHeight));
      const date = days[Math.max(0, index)];
      if (date)
        setVisibleMonth((current) => (current.slice(0, 7) === date.slice(0, 7) ? current : date));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [start, days.length, days]);

  if (habits.length === 0) {
    return (
      <>
        <div class="placeholder">
          <div class="placeholder-mark" aria-hidden="true" />
          <p>No habits yet.</p>
          <p class="hint">Add one and it becomes a column you tap down the days.</p>
        </div>
        <button type="button" class="add-button" onClick={() => setAdding(true)}>
          + New habit
        </button>
        {adding && <HabitSheet onClose={() => setAdding(false)} />}
      </>
    );
  }

  return (
    <div class="log">
      <div class="log-month" aria-live="polite">
        {monthLabel(visibleMonth)}
      </div>

      <div class="log-head" style={{ '--cols': habits.length }}>
        <span class="log-corner" />
        {habits.map((habit) => (
          <button
            key={habit.id}
            type="button"
            class="log-col-head"
            aria-label={`${habit.name} details`}
            onClick={() => setDetail(habit)}
          >
            <Mark shape={habit.shape} color={habit.color} status="complete" size={22} />
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
                <span class="log-dow">{dayName(date).toUpperCase()}</span>
              </div>

              {habits.map((habit) => {
                const status = statusOf(habit, entryFor(habit.id, date), date, today.value);
                const locked = future || !isApplicable(habit, date, today.value);

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
                    <Mark
                      shape={habit.shape}
                      color={habit.color}
                      status={status}
                      size={30}
                      isToday={isToday}
                    />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {adding && <HabitSheet onClose={() => setAdding(false)} />}
      {detail && <HabitDetail habit={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
