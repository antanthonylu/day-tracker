import { dayName, shortDateLabel } from '../domain/dates';
import { earliestDate, today } from '../store/store';

interface Props {
  value: string;
  /** Moves by whole days. The caller steps from its own latest state, so a
      flurry of taps advances once per tap instead of collapsing into one. */
  onStep: (days: number) => void;
  onToday: () => void;
}

/**
 * Moves one day at a time, back as far as 1 January of this year (further if
 * older data exists) and forward without a stop -- you can look at a day that
 * hasn't come yet, you just can't log it.
 */
export function DateSwitcher({ value, onStep, onToday }: Props) {
  const atStart = value <= earliestDate.value;
  const isToday = value === today.value;

  return (
    <div class="switcher">
      <button type="button" aria-label="Previous day" disabled={atStart} onClick={() => onStep(-1)}>
        &#8249;
      </button>

      <button type="button" class="switcher-label" onClick={onToday}>
        <span class="switcher-main">{isToday ? 'Today' : shortDateLabel(value)}</span>
        <span class="switcher-sub">{isToday ? shortDateLabel(value) : dayName(value, 'long')}</span>
      </button>

      <button type="button" aria-label="Next day" onClick={() => onStep(1)}>
        &#8250;
      </button>
    </div>
  );
}
