import { dayName, dayOfWeek, lastNDays, parseDateKey } from '../domain/dates';
import { isApplicable, statusOf } from '../domain/status';
import { WEEK_STARTS_ON } from '../domain/types';
import { activeHabits, entryFor, today } from '../store/store';

interface Props {
  selected: string;
  onSelect: (date: string) => void;
}

const CIRCUMFERENCE = 2 * Math.PI * 15;

/**
 * The seven days up to whatever day is in view, each a ring filled by how much
 * of that day got done. It is a glance, not a chart: enough to spot a gap.
 */
export function WeekStrip({ selected, onSelect }: Props) {
  const days = lastNDays(selected, 7);

  return (
    <div class="week-strip">
      {days.map((date, index) => {
        const due = activeHabits.value.filter((h) => isApplicable(h, date, today.value));
        const done = due.filter(
          (h) => statusOf(h, entryFor(h.id, date), date, today.value) === 'complete',
        ).length;
        const ratio = due.length === 0 ? 0 : done / due.length;

        // A dashed rule where one week ends and the next begins, so a run of
        // days reads as weeks rather than an undifferentiated row.
        const startsWeek = index > 0 && dayOfWeek(date) === WEEK_STARTS_ON;

        return (
          <button
            key={date}
            type="button"
            class={[
              'week-day',
              date === selected ? 'selected' : '',
              date > today.value ? 'future' : '',
              startsWeek ? 'week-break' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={`${dayName(date, 'long')} ${parseDateKey(date).day}, ${done} of ${due.length} done`}
            aria-current={date === selected ? 'date' : undefined}
            onClick={() => onSelect(date)}
          >
            <span class="week-dow">{dayName(date)}</span>
            <svg viewBox="0 0 36 36" width="26" height="26" aria-hidden="true">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                opacity="0.25"
              />
              {ratio > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--accent)"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-dasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  transform="rotate(-90 18 18)"
                />
              )}
            </svg>
            <span class="week-num">{parseDateKey(date).day}</span>
          </button>
        );
      })}
    </div>
  );
}
