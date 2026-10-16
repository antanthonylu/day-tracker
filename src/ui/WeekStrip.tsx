import { dayName, lastNDays, parseDateKey } from '../domain/dates';
import { isApplicable, statusOf } from '../domain/status';
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
      {days.map((date) => {
        const due = activeHabits.value.filter((h) => isApplicable(h, date, today.value));
        const done = due.filter(
          (h) => statusOf(h, entryFor(h.id, date), date, today.value) === 'complete',
        ).length;
        const ratio = due.length === 0 ? 0 : done / due.length;

        return (
          <button
            key={date}
            type="button"
            class={`week-day${date === selected ? ' selected' : ''}${date > today.value ? ' future' : ''}`}
            aria-label={`${date}, ${done} of ${due.length} done`}
            aria-current={date === selected ? 'date' : undefined}
            onClick={() => onSelect(date)}
          >
            <span class="week-dow">{dayName(date, 'narrow')}</span>
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
