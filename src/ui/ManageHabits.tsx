import { useState } from 'preact/hooks';
import { Mark } from './Mark';
import { Sheet } from './Sheet';
import { HabitSheet } from './HabitSheet';
import { ConfirmSheet } from './ConfirmSheet';
import type { Habit } from '../domain/types';
import {
  activeHabits,
  archiveHabit,
  archivedHabits,
  deleteHabit,
  reorderHabits,
  today,
  unarchiveHabit,
} from '../store/store';

export function ManageHabits({ onClose }: { onClose: () => void }) {
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);

  function move(index: number, by: number) {
    const ids = activeHabits.value.map((h) => h.id);
    const target = index + by;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    void reorderHabits(next);
  }

  return (
    <Sheet
      title="Manage habits"
      onClose={onClose}
      hideCancel
      action={{ label: 'Done', onClick: onClose }}
    >
      {activeHabits.value.length === 0 && <p class="hint">No active habits.</p>}

      <ul class="manage-list">
        {activeHabits.value.map((habit, index) => (
          <li key={habit.id}>
            {/* Arrows rather than drag: they work with one thumb and don't
                fight the page scroll the way a long-press drag does. */}
            <div class="reorder">
              <button
                type="button"
                aria-label={`Move ${habit.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                &#9650;
              </button>
              <button
                type="button"
                aria-label={`Move ${habit.name} down`}
                disabled={index === activeHabits.value.length - 1}
                onClick={() => move(index, 1)}
              >
                &#9660;
              </button>
            </div>

            <Mark shape={habit.shape} color={habit.color} status="complete" size={24} />
            <span class="manage-name">{habit.name}</span>

            <button type="button" class="link" onClick={() => setEditing(habit)}>
              Edit
            </button>
            <button
              type="button"
              class="link"
              onClick={() => void archiveHabit(habit.id, today.value)}
            >
              Archive
            </button>
          </li>
        ))}
      </ul>

      {archivedHabits.value.length > 0 && (
        <>
          <h3 class="section-head">Archived</h3>
          <p class="hint">
            Archived habits keep their history and stay out of Today. Deleting one removes
            everything it ever logged.
          </p>
          <ul class="manage-list">
            {archivedHabits.value.map((habit) => (
              <li key={habit.id}>
                <Mark shape={habit.shape} color={habit.color} status="missed" size={24} />
                <span class="manage-name dim">{habit.name}</span>
                <button type="button" class="link" onClick={() => void unarchiveHabit(habit.id)}>
                  Restore
                </button>
                <button type="button" class="link danger" onClick={() => setDeleting(habit)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && <HabitSheet habit={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmSheet
          title="Delete habit"
          body={`Delete “${deleting.name}” and every day you ever logged for it? This cannot be undone.`}
          confirmLabel="Delete permanently"
          destructive
          onConfirm={() => void deleteHabit(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </Sheet>
  );
}
