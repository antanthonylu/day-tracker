import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DateKey, Entry, ExportFile, Habit, HabitId, Settings } from '../domain/types';
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from '../domain/types';
import type { Snapshot, StorageAdapter } from './StorageAdapter';
import { migrate } from './migrations';

const DB_NAME = 'day-tracker';
const DB_VERSION = 1;

interface DayTrackerDB extends DBSchema {
  habits: {
    key: HabitId;
    value: Habit;
  };
  entries: {
    key: [HabitId, DateKey];
    value: Entry;
    indexes: { date: DateKey };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const SETTINGS_KEY = 'settings';
const SCHEMA_KEY = 'schemaVersion';

export class IndexedDbAdapter implements StorageAdapter {
  #db: IDBPDatabase<DayTrackerDB> | null = null;

  async init(): Promise<void> {
    this.#db = await openDB<DayTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('entries')) {
          // Compound key means one row per habit per day, and writing the same
          // day twice updates rather than duplicates.
          const entries = db.createObjectStore('entries', { keyPath: ['habitId', 'date'] });
          entries.createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });

    const stored = (await this.#require().get('meta', SCHEMA_KEY)) as number | undefined;
    if (stored === undefined) {
      await this.#require().put('meta', SCHEMA_VERSION, SCHEMA_KEY);
    } else if (stored !== SCHEMA_VERSION) {
      // Data already in the store is migrated through the same path a backup
      // file takes, so there is only ever one set of migration rules.
      const current = await this.exportAll();
      await this.importAll(migrate({ ...current, schemaVersion: stored }));
    }
  }

  #require(): IDBPDatabase<DayTrackerDB> {
    if (!this.#db) throw new Error('Storage used before init()');
    return this.#db;
  }

  async loadAll(): Promise<Snapshot> {
    const db = this.#require();
    const [habits, entries, settings] = await Promise.all([
      db.getAll('habits'),
      db.getAll('entries'),
      db.get('meta', SETTINGS_KEY) as Promise<Settings | undefined>,
    ]);
    return {
      habits: habits.sort((a, b) => a.order - b.order),
      entries,
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
    };
  }

  async saveHabit(habit: Habit): Promise<void> {
    await this.#require().put('habits', habit);
  }

  async saveHabits(habits: Habit[]): Promise<void> {
    const tx = this.#require().transaction('habits', 'readwrite');
    await Promise.all([...habits.map((h) => tx.store.put(h)), tx.done]);
  }

  async deleteHabit(id: HabitId): Promise<void> {
    const db = this.#require();
    const tx = db.transaction(['habits', 'entries'], 'readwrite');
    const entries = tx.objectStore('entries');
    // Delete the habit and everything it ever logged in one transaction, so a
    // failure can't leave orphaned entries behind.
    let cursor = await entries.openCursor();
    while (cursor) {
      if (cursor.value.habitId === id) await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.objectStore('habits').delete(id);
    await tx.done;
  }

  async saveEntry(entry: Entry): Promise<void> {
    const db = this.#require();
    // Zero is the absence of a value, not a value: storing it would litter the
    // database with rows meaning "nothing happened".
    if (entry.value <= 0) {
      await db.delete('entries', [entry.habitId, entry.date]);
      return;
    }
    await db.put('entries', entry);
  }

  async deleteEntry(habitId: HabitId, date: DateKey): Promise<void> {
    await this.#require().delete('entries', [habitId, date]);
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.#require().put('meta', settings, SETTINGS_KEY);
  }

  async exportAll(): Promise<ExportFile> {
    const { habits, entries, settings } = await this.loadAll();
    return {
      app: 'day-tracker',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      habits,
      entries,
      settings,
    };
  }

  async importAll(file: ExportFile): Promise<void> {
    const db = this.#require();
    const tx = db.transaction(['habits', 'entries', 'meta'], 'readwrite');
    await Promise.all([tx.objectStore('habits').clear(), tx.objectStore('entries').clear()]);
    await Promise.all([
      ...file.habits.map((h) => tx.objectStore('habits').put(h)),
      ...file.entries.map((e) => tx.objectStore('entries').put(e)),
      tx.objectStore('meta').put(file.settings, SETTINGS_KEY),
      tx.objectStore('meta').put(SCHEMA_VERSION, SCHEMA_KEY),
    ]);
    await tx.done;
  }

  async stats(): Promise<{ habits: number; entries: number }> {
    const db = this.#require();
    const [habits, entries] = await Promise.all([db.count('habits'), db.count('entries')]);
    return { habits, entries };
  }
}
