import { useState } from 'preact/hooks';
import { Sheet } from './Sheet';
import { HabitBadge, Mark } from './Mark';
import { MiniMonth } from './MiniMonth';
import { HabitSheet } from './HabitSheet';
import { shareCard } from '../share/card';
import { dayName, monthLabel, startOfMonth } from '../domain/dates';
import { allTimeCompletion, bestWeekday, monthCompletion, yearCompletion } from '../domain/stats';
import type { Habit } from '../domain/types';
import { archiveHabit, earliestDate, entryFor, today, unarchiveHabit } from '../store/store';

const DAY_SAMPLES = [
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
  '2026-11-05',
  '2026-11-06',
  '2026-11-07',
];

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function HabitDetail({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const now = today.value;
  const from = earliestDate.value;
  const lookup = entryFor;

  const month = monthCompletion(habit, now, now, lookup);
  const year = yearCompletion(habit, now, now, lookup);
  const all = allTimeCompletion(habit, from, now, lookup);
  const strongest = bestWeekday(habit, from, now, lookup);

  return (
    <Sheet
      title={habit.name}
      onClose={onClose}
      hideCancel
      action={{ label: 'Done', onClick: onClose }}
    >
      <div class="preview">
        <HabitBadge shape={habit.shape} icon={habit.icon} color={habit.color} size={24} />
        <Mark shape={habit.shape} color={habit.color} status="complete" size={40} />
        <span>{habit.name}</span>
      </div>

      <div class="stat-grid">
        <Stat label="This month" value={percent(month.rate)} unit={`${month.done}/${month.days}`} />
        <Stat label="This year" value={percent(year.rate)} unit={`${year.done}/${year.days}`} />
        <Stat label="Total days" value={`${all.done}`} unit="marked" />
      </div>

      {strongest && (
        <p class="hint">
          Strongest on {dayName(DAY_SAMPLES[strongest.day]!, 'long')}s — {percent(strongest.rate)}{' '}
          of them done.
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
