import { signal, computed } from '@preact/signals';
import type { DateKey, Entry, Habit, HabitId, Settings } from '../domain/types';
import { DAY_STARTS_AT_HOUR, DEFAULT_SETTINGS } from '../domain/types';
import { earliestNavigableDate, todayKey } from '../domain/dates';
import { IndexedDbAdapter } from '../storage/IndexedDbAdapter';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { requestPersistentStorage, type PersistenceState } from '../storage/persist';

const entryKey = (habitId: HabitId, date: DateKey) => `${habitId}|${date}`;

let adapter: StorageAdapter = new IndexedDbAdapter();

/** Swaps the backing store. Tests use this; a Scriptable build would too. */
export function setAdapter(next: StorageAdapter): void {
  adapter = next;
}

export const ready = signal(false);
export const loadError = signal<string | null>(null);
export const habits = signal<Habit[]>([]);
export const entries = signal<Map<string, Entry>>(new Map());
export const settings = signal<Settings>(DEFAULT_SETTINGS);
export const persistence = signal<PersistenceState>('unsupported');

/**
 * Ticks when the calendar day might have rolled over -- on load, and whenever
 * the app comes back to the foreground. A PWA left open overnight would
 * otherwise still think it is yesterday.
 */
const dayTick = signal(0);

export const today = computed<DateKey>(() => {
  void dayTick.value; // subscribe: re-evaluate when the day may have rolled over
  return todayKey(DAY_STARTS_AT_HOUR);
});

/** Oldest day the switchers will travel to: 1 January this year, or earlier. */
export const earliestDate = computed<DateKey>(() => {
  let earliest: DateKey | undefined;
  for (const h of habits.value) {
    if (!earliest || h.createdAt < earliest) earliest = h.createdAt;
  }
  for (const e of entries.value.values()) {
    if (!earliest || e.date < earliest) earliest = e.date;
  }
  return earliestNavigableDate(today.value, earliest);
});

export const activeHabits = computed(() =>
  habits.value.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order),
);

export const archivedHabits = computed(() =>
  habits.value.filter((h) => h.archivedAt).sort((a, b) => a.order - b.order),
);

export function entryFor(habitId: HabitId, date: DateKey): Entry | undefined {
  return entries.value.get(entryKey(habitId, date));
}

export function refreshToday(): void {
  dayTick.value += 1;
}

export async function load(): Promise<void> {
  try {
    await adapter.init();
    const snapshot = await adapter.loadAll();
    habits.value = snapshot.habits;
    entries.value = new Map(snapshot.entries.map((e) => [entryKey(e.habitId, e.date), e]));
    settings.value = snapshot.settings;
    applyTheme(snapshot.settings.theme);
    ready.value = true;
    persistence.value = await requestPersistentStorage();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
    ready.value = true;
  }
}

/* ---- habits ---- */

export async function addHabit(draft: Omit<Habit, 'id' | 'order'>): Promise<Habit> {
  const order = habits.value.reduce((max, h) => Math.max(max, h.order), -1) + 1;
  const habit: Habit = { ...draft, id: crypto.randomUUID(), order };
  habits.value = [...habits.value, habit];
  await adapter.saveHabit(habit);
  return habit;
}

export async function updateHabit(habit: Habit): Promise<void> {
  habits.value = habits.value.map((h) => (h.id === habit.id ? habit : h));
  await adapter.saveHabit(habit);
}

export async function archiveHabit(id: HabitId, on: DateKey): Promise<void> {
  const habit = habits.value.find((h) => h.id === id);
  if (!habit) return;
  await updateHabit({ ...habit, archivedAt: on });
}

export async function unarchiveHabit(id: HabitId): Promise<void> {
  const habit = habits.value.find((h) => h.id === id);
  if (!habit) return;
  const { archivedAt: _archivedAt, ...rest } = habit;
  await updateHabit(rest);
}

/** Removes the habit and everything it ever logged. */
export async function deleteHabit(id: HabitId): Promise<void> {
  habits.value = habits.value.filter((h) => h.id !== id);
  const next = new Map(entries.value);
  for (const [key, entry] of next) if (entry.habitId === id) next.delete(key);
  entries.value = next;
  await adapter.deleteHabit(id);
}

/** Applies a new manual ordering, renumbering from zero. */
export async function reorderHabits(orderedIds: HabitId[]): Promise<void> {
  const position = new Map(orderedIds.map((id, index) => [id, index]));
  const renumbered = habits.value.map((h) =>
    position.has(h.id) ? { ...h, order: position.get(h.id)! } : h,
  );
  habits.value = renumbered.sort((a, b) => a.order - b.order);
  await adapter.saveHabits(renumbered);
}

/* ---- entries ---- */

export async function setValue(habit: Habit, date: DateKey, value: number): Promise<void> {
  const clamped = Math.max(0, value);
  const next = new Map(entries.value);
  const key = entryKey(habit.id, date);

  if (clamped <= 0) next.delete(key);
  else next.set(key, { habitId: habit.id, date, value: clamped });

  entries.value = next;
  await adapter.saveEntry({ habitId: habit.id, date, value: clamped });
}

/** Done becomes not-done and back. */
export async function toggleCheck(habit: Habit, date: DateKey): Promise<void> {
  await setValue(habit, date, entryFor(habit.id, date)?.value ? 0 : 1);
}

/** Alias used by the calendar grids, where a tap means the same thing. */
export const toggleDay = toggleCheck;

/* ---- settings ---- */

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...settings.value, ...patch };
  settings.value = next;
  if (patch.theme) applyTheme(patch.theme);
  await adapter.saveSettings(next);
}

export function applyTheme(theme: Settings['theme']): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function storageStats(): Promise<{ habits: number; entries: number }> {
  return adapter.stats();
}
