import { useState } from 'preact/hooks';
import { Sheet } from './Sheet';
import { HabitBadge, HabitIcon, Mark } from './Mark';
import { PALETTE, nextColor } from '../domain/palette';
import { ICON_IDS, ICON_LABELS } from '../domain/icons';
import { SHAPE_IDS, SHAPE_LABELS } from '../domain/shapes';
import type { Habit, IconId, ShapeId } from '../domain/types';
import { addHabit, habits, updateHabit } from '../store/store';

interface Props {
  habit?: Habit;
  onClose: () => void;
}

export function HabitSheet({ habit, onClose }: Props) {
  const editing = Boolean(habit);
  const [name, setName] = useState(habit?.name ?? '');
  const [color, setColor] = useState(habit?.color ?? nextColor(habits.value.length));
  const [shape, setShape] = useState<ShapeId>(habit?.shape ?? 'blob');
  const [icon, setIcon] = useState<IconId>(habit?.icon ?? 'dumbbell');

  const trimmed = name.trim();
  const valid = trimmed.length > 0;

  async function save() {
    if (!valid) return;

    const draft: Omit<Habit, 'id' | 'order'> = { name: trimmed, color, shape, icon };

    if (habit) {
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
        <HabitBadge shape={shape} icon={icon} color={color} size={24} />
        <Mark shape={shape} color={color} status="complete" size={40} />
        <span>
          {trimmed || 'Unnamed habit'}
          <small class="dim">header icon · day mark</small>
        </span>
      </div>

      <label class="field">
        <span>Name</span>
        <input
          type="text"
          value={name}
          placeholder="Gym, Read, Walk…"
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
        <legend>Icon</legend>
        <div class="icons">
          {ICON_IDS.map((id) => (
            <button
              key={id}
              type="button"
              class={`icon-option${id === icon ? ' selected' : ''}`}
              aria-label={ICON_LABELS[id]}
              aria-pressed={id === icon}
              onClick={() => setIcon(id)}
            >
              <HabitIcon icon={id} color={id === icon ? color : 'currentColor'} size={22} />
            </button>
          ))}
        </div>
        <p class="hint">Shown at the top of the habit's column.</p>
      </fieldset>

      <fieldset class="field">
        <legend>Day mark</legend>
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
        <p class="hint">Stamped into every day you log.</p>
      </fieldset>
    </Sheet>
  );
}
