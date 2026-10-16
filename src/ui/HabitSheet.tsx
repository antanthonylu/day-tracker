import { useState } from 'preact/hooks';
import { Sheet } from './Sheet';
import { Mark } from './Mark';
import { PALETTE, nextColor } from '../domain/palette';
import { SHAPE_IDS, SHAPE_LABELS } from '../domain/shapes';
import type { Habit, HabitKind, ShapeId } from '../domain/types';
import { addHabit, habits, today, updateHabit } from '../store/store';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props {
  habit?: Habit;
  onClose: () => void;
}

export function HabitSheet({ habit, onClose }: Props) {
  const editing = Boolean(habit);
  const [name, setName] = useState(habit?.name ?? '');
  const [color, setColor] = useState(habit?.color ?? nextColor(habits.value.length));
  const [shape, setShape] = useState<ShapeId>(habit?.shape ?? 'circle');
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'check');
  const [target, setTarget] = useState(String(habit?.target ?? 8));
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [step, setStep] = useState(String(habit?.step ?? 1));
  const [activeDays, setActiveDays] = useState<number[]>(
    habit?.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
  );
  const [startDate, setStartDate] = useState(habit?.createdAt ?? today.value);

  const trimmed = name.trim();
  const parsedTarget = Number(target);
  const parsedStep = Number(step);
  const valid =
    trimmed.length > 0 &&
    activeDays.length > 0 &&
    (kind === 'check' || (parsedTarget > 0 && parsedStep > 0));

  function toggleDay(day: number) {
    setActiveDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort(),
    );
  }

  async function save() {
    if (!valid) return;

    const draft: Omit<Habit, 'id' | 'order'> = {
      name: trimmed,
      color,
      shape,
      kind,
      createdAt: startDate,
    };

    // All seven days selected is the same as "no schedule"; storing it as
    // undefined keeps the common case out of every applicability check.
    if (activeDays.length < 7) draft.activeDays = activeDays;

    if (kind === 'count') {
      draft.target = parsedTarget;
      draft.step = parsedStep;
      if (unit.trim()) draft.unit = unit.trim();
    }

    if (habit) {
      // Rebuild rather than spread, so switching Count -> Check actually drops
      // the old target instead of leaving a stale one behind.
      await updateHabit({
        ...draft,
        id: habit.id,
        order: habit.order,
        ...(habit.archivedAt ? { archivedAt: habit.archivedAt } : {}),
      });
    } else {
      await addHabit(draft);
    }
    onClose();
  }

  return (
    <Sheet
      title={editing ? 'Edit habit' : 'New habit'}
      onClose={onClose}
      action={{ label: 'Save', onClick: () => void save(), disabled: !valid }}
    >
      <div class="preview">
        <Mark shape={shape} color={color} status="complete" size={48} />
        <span>{trimmed || 'Unnamed habit'}</span>
      </div>

      <label class="field">
        <span>Name</span>
        <input
          type="text"
          value={name}
          placeholder="Read, Water, Walk…"
          maxLength={40}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />
      </label>

      <fieldset class="field">
        <legend>Colour</legend>
        <div class="swatches">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              type="button"
              class={`swatch${c.hex === color ? ' selected' : ''}`}
              style={{ background: c.hex }}
              aria-label={c.name}
              aria-pressed={c.hex === color}
              onClick={() => setColor(c.hex)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset class="field">
        <legend>Shape</legend>
        <div class="shapes">
          {SHAPE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              class={`shape-option${id === shape ? ' selected' : ''}`}
              aria-label={SHAPE_LABELS[id]}
              aria-pressed={id === shape}
              onClick={() => setShape(id)}
            >
              <Mark shape={id} color={color} status="complete" size={30} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset class="field">
        <legend>Kind</legend>
        <div class="segmented">
          <button
            type="button"
            class={kind === 'check' ? 'selected' : ''}
            onClick={() => setKind('check')}
          >
            Check
          </button>
          <button
            type="button"
            class={kind === 'count' ? 'selected' : ''}
            onClick={() => setKind('count')}
          >
            Count
          </button>
        </div>
        <p class="hint">
          {kind === 'check'
            ? 'One tap marks the day done.'
            : 'Tap to add to a running total until you hit the target.'}
        </p>
      </fieldset>

      {kind === 'count' && (
        <div class="row-fields">
          <label class="field">
            <span>Target</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={target}
              onInput={(e) => setTarget((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="field">
            <span>Unit</span>
            <input
              type="text"
              value={unit}
              placeholder="glasses"
              maxLength={12}
              onInput={(e) => setUnit((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="field">
            <span>Per tap</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={step}
              onInput={(e) => setStep((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      )}

      <fieldset class="field">
        <legend>Active days</legend>
        <div class="days">
          {DAY_INITIALS.map((initial, day) => (
            <button
              key={day}
              type="button"
              class={`day-toggle${activeDays.includes(day) ? ' selected' : ''}`}
              aria-label={DAY_NAMES[day]}
              aria-pressed={activeDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {initial}
            </button>
          ))}
        </div>
        <p class="hint">Days you switch off are skipped — they never break a streak.</p>
      </fieldset>

      <label class="field">
        <span>Start date</span>
        <input
          type="date"
          value={startDate}
          max={today.value}
          onInput={(e) => setStartDate((e.target as HTMLInputElement).value)}
        />
        <p class="hint">Stats and streaks begin here.</p>
      </label>
    </Sheet>
  );
}
