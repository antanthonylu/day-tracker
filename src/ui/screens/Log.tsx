import { useState } from 'preact/hooks';
import { LogGrid } from '../LogGrid';
import { lazyScreen } from '../lazyScreen';
import type { Habit } from '../../domain/types';
import { activeHabits } from '../../store/store';

const HabitSheet = lazyScreen(() => import('../HabitSheet').then((m) => m.HabitSheet));
const HabitDetail = lazyScreen(() => import('../HabitDetail').then((m) => m.HabitDetail));

export function Log() {
  const habits = activeHabits.value;
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Habit | null>(null);

  if (habits.length === 0) {
    return (
      <>
        <div class="placeholder">
          <div class="placeholder-mark" aria-hidden="true" />
          <p>No habits yet.</p>
          <p class="hint">Add one and it becomes a column you tap down the days.</p>
        </div>
        <button type="button" class="add-button" onClick={() => setAdding(true)}>
          + New habit
        </button>
        {adding && <HabitSheet onClose={() => setAdding(false)} />}
      </>
    );
  }

  return (
    <>
      {/* Keyed on the habit columns so that adding the first habit mounts a
          fresh grid, which is what re-runs the scroll-to-today. Without this
          the list opened two months in the past with no visible way to log. */}
      <LogGrid key={habits.map((h) => h.id).join()} habits={habits} onOpenHabit={setDetail} />
      {detail && <HabitDetail habit={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
