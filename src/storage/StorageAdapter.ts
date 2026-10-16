import type { DateKey, Entry, ExportFile, Habit, HabitId, Settings } from '../domain/types';

/** Everything the app holds, in one shot. */
export interface Snapshot {
  habits: Habit[];
  entries: Entry[];
  settings: Settings;
}

/**
 * The single seam between the app and wherever its data lives.
 *
 * Nothing above this line knows about IndexedDB. That is what lets a future
 * Scriptable widget swap in a file-backed adapter and read the very same
 * habits without the domain or UI code changing.
 */
export interface StorageAdapter {
  /** Open the store and run any pending migrations. */
  init(): Promise<void>;

  loadAll(): Promise<Snapshot>;

  saveHabit(habit: Habit): Promise<void>;
  saveHabits(habits: Habit[]): Promise<void>;
  deleteHabit(id: HabitId): Promise<void>;

  /** Writes a value, or clears the day when value is 0. */
  saveEntry(entry: Entry): Promise<void>;
  deleteEntry(habitId: HabitId, date: DateKey): Promise<void>;

  saveSettings(settings: Settings): Promise<void>;

  exportAll(): Promise<ExportFile>;
  /** Replaces everything, atomically. */
  importAll(file: ExportFile): Promise<void>;

  /** Rough counts for the storage panel in Settings. */
  stats(): Promise<{ habits: number; entries: number }>;
}
