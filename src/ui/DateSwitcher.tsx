import { addDays, dayName, shortDateLabel } from '../domain/dates';
import { earliestDate, today } from '../store/store';

interface Props {
  value: string;
  /** Moves by whole days. The caller steps from its own latest state, so a
      flurry of taps advances once per tap instead of collapsing into one. */
  onStep: (days: number) => void;
  onToday: () => void;
}

/** 'Today' / 'Yesterday' when that's the clearer label, else the year. */
function relativeLabel(value: string, todayKey: string): string {
  if (value === todayKey) return 'Today';
  if (value === addDays(todayKey, -1)) return 'Yesterday';
  if (value === addDays(todayKey, 1)) return 'Tomorrow';
  return value.slice(0, 4);
}

/**
 * Moves one day at a time, back as far as 1 January of this year (further if
 * older data exists) and forward without a stop -- you can look at a day that
 * hasn't come yet, you just can't log it.
 */
export function DateSwitcher({ value, onStep, onToday }: Props) {
  const atStart = value <= earliestDate.value;

  return (
    <div class="switcher">
      <button type="button" aria-label="Previous day" disabled={atStart} onClick={() => onStep(-1)}>
        &#8249;
      </button>

      <button
        type="button"
        class="switcher-label"
        onClick={onToday}
        aria-label={`${dayName(value, 'long')} ${shortDateLabel(value)}. Jump to today.`}
      >
        {/* Weekday and date together: which day of the week it was matters as
            much as the number when you're fixing up a missed log. */}
        <span class="switcher-main">
          {dayName(value)} {shortDateLabel(value)}
        </span>
        <span class="switcher-sub">{relativeLabel(value, today.value)}</span>
      </button>

      <button type="button" aria-label="Next day" onClick={() => onStep(1)}>
        &#8250;
      </button>
    </div>
  );
}
