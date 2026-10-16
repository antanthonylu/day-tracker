import { Sheet } from './Sheet';
import { Mark } from './Mark';
import { MiniMonth } from './MiniMonth';
import { dayName, monthLabel, startOfMonth } from '../domain/dates';
import {
  allTimeCompletion,
  bestStreak,
  bestWeekday,
  currentStreak,
  monthCompletion,
  yearCompletion,
} from '../domain/stats';
import type { Habit } from '../domain/types';
import { archiveHabit, entryFor, today, unarchiveHabit } from '../store/store';
import { useState } from 'preact/hooks';
import { HabitSheet } from './HabitSheet';
import { shareCard } from '../share/card';

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function HabitDetail({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const now = today.value;
  const lookup = entryFor;

  const current = currentStreak(habit, now, lookup);
  const best = bestStreak(habit, now, lookup);
  const month = monthCompletion(habit, now, now, lookup);
  const year = yearCompletion(habit, now, now, lookup);
  const all = allTimeCompletion(habit, now, lookup);
  const strongest = bestWeekday(habit, now, lookup);

  // The gauge compares the current run to the best one, so a long streak reads
  // as progress rather than a bare number.
  const gauge = best === 0 ? 0 : Math.min(1, current / best);

  return (
    <Sheet title={habit.name} onClose={onClose}>
      <div class="preview">
        <Mark shape={habit.shape} color={habit.color} status="complete" size={48} />
        <span>
          {habit.name}
          <small class="dim">
            {habit.activeDays ? `${habit.activeDays.length} days a week` : 'every day'}
          </small>
        </span>
      </div>

      <div class="stat-grid">
        <Stat label="Current streak" value={`${current}`} unit={current === 1 ? 'day' : 'days'} />
        <Stat label="Best streak" value={`${best}`} unit={best === 1 ? 'day' : 'days'} />
        <Stat
          label="This month"
          value={percent(month.rate)}
          unit={`${month.done}/${month.applicable}`}
        />
        <Stat
          label="This year"
          value={percent(year.rate)}
          unit={`${year.done}/${year.applicable}`}
        />
        <Stat label="All time" value={percent(all.rate)} unit={`${all.done}/${all.applicable}`} />
        <Stat label="Total days" value={`${all.done}`} unit="marked" />
      </div>

      {best > 0 && (
        <div class="gauge" aria-label={`Current streak ${current} of best ${best}`}>
          <div class="gauge-track">
            <div class="gauge-fill" style={{ width: `${gauge * 100}%`, background: habit.color }} />
          </div>
          <div class="gauge-labels">
            <span>now {current}</span>
            <span>best {best}</span>
          </div>
        </div>
      )}

      {strongest && (
        <p class="hint">
          Strongest on {dayName(`2026-11-0${strongest.day + 1}`, 'long')}s —{' '}
          {percent(strongest.rate)} of them done.
        </p>
      )}

      <h3 class="section-head">{monthLabel(now)}</h3>
      <MiniMonth month={startOfMonth(now)} habit={habit} size="large" />

      <div class="detail-actions">
        <button type="button" class="wide-button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          class="wide-button"
          onClick={() => void shareCard(habit, startOfMonth(now), now, lookup)}
        >
          Share card
        </button>
        {habit.archivedAt ? (
          <button
            type="button"
            class="wide-button"
            onClick={() => void unarchiveHabit(habit.id).then(onClose)}
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            class="wide-button"
            onClick={() => void archiveHabit(habit.id, now).then(onClose)}
          >
            Archive
          </button>
        )}
      </div>

      {editing && <HabitSheet habit={habit} onClose={() => setEditing(false)} />}
    </Sheet>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div class="stat">
      <span class="stat-label">{label}</span>
      <span class="stat-value">{value}</span>
      {unit && <span class="stat-unit">{unit}</span>}
    </div>
  );
}
