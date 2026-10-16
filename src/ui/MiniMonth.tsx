import { dayName, monthGrid, parseDateKey, startOfMonth } from '../domain/dates';
import { statusOf } from '../domain/status';
import type { PieDay } from '../domain/pie';
import { WEEK_STARTS_ON, type DateKey, type Habit } from '../domain/types';
import { entryFor, today } from '../store/store';
import { Mark } from './Mark';

interface Props {
  month: DateKey;
  /** A single habit's calendar, or every habit as a pie when omitted. */
  habit?: Habit;
  /** Precomputed wedges, required when drawing pies. */
  pies?: Map<DateKey, PieDay>;
  size?: 'small' | 'large';
  onPick?: (date: DateKey) => void;
}

const DOW_HEADERS = [
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
  '2026-11-05',
  '2026-11-06',
  '2026-11-07',
];

export function MiniMonth({ month, habit, pies, size = 'small', onPick }: Props) {
  const anchor = startOfMonth(month);
  const { month: monthNumber } = parseDateKey(anchor);
  const days = monthGrid(anchor, WEEK_STARTS_ON);
  const cell = size === 'large' ? 34 : 13;

  return (
    <div class={`mini-month ${size}`}>
      {size === 'large' && (
        <div class="mini-dow">
          {DOW_HEADERS.map((d) => (
            <span key={d}>{dayName(d, 'narrow')}</span>
          ))}
        </div>
      )}

      <div class="mini-grid">
        {days.map((date) => {
          const outside = parseDateKey(date).month !== monthNumber;
          if (outside) return <span key={date} class="mini-cell empty" />;

          const content = habit ? (
            <Mark
              shape={habit.shape}
              color={habit.color}
              status={statusOf(habit, entryFor(habit.id, date), date, today.value)}
              size={cell}
            />
          ) : (
            <DayPie day={pies?.get(date)} size={cell} />
          );

          if (!onPick) {
            return (
              <span key={date} class={`mini-cell${date === today.value ? ' today' : ''}`}>
                {content}
              </span>
            );
          }

          return (
            <button
              key={date}
              type="button"
              class={`mini-cell${date === today.value ? ' today' : ''}`}
              aria-label={date}
              onClick={() => onPick(date)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Every habit due that day as an equal wedge, filled when it was done.
 *
 * Equal wedges rather than only-completed slices: the size of the gap then
 * means something, so a half-empty circle reads as half a day.
 */
export function DayPie({ day, size }: { day: PieDay | undefined; size: number }) {
  if (!day || day.total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" class="pie" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.3"
        />
      </svg>
    );
  }

  const slice = 360 / day.total;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" class="pie" aria-hidden="true">
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        opacity="0.22"
      />
      {day.colors.map((color, i) => (
        <path key={i} d={wedge(20, 20, 17, i * slice, (i + 1) * slice)} fill={color} />
      ))}
    </svg>
  );
}

/** A pie wedge from `from` to `to` degrees, measured clockwise from 12 o'clock. */
function wedge(cx: number, cy: number, r: number, from: number, to: number): string {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  // A full circle can't be drawn as one arc: its start and end coincide.
  if (to - from >= 360) {
    return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const large = to - from > 180 ? 1 : 0;
  return `M${cx} ${cy} L${point(from)} A${r} ${r} 0 ${large} 1 ${point(to)} Z`;
}
