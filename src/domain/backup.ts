import { isValidDateKey } from './dates';
import { isIconId } from './icons';
import { isKnownShape, resolveShape } from './shapes';
import type { Entry, ExportFile, Habit, Settings } from './types';
import { SCHEMA_VERSION } from './types';

/**
 * Hand-written type guards rather than a schema library.
 *
 * An import replaces everything you have, so the cost of letting a malformed
 * file through is losing the lot. Validation is explicit and total: every
 * field is checked, unknown habit references in entries are rejected, and the
 * file is either wholly good or wholly refused.
 */

export class InvalidBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBackupError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseHabit(raw: unknown, index: number): Habit {
  const where = `habits[${index}]`;
  if (!isRecord(raw)) throw new InvalidBackupError(`${where} is not an object`);

  const { id, name, color, shape, icon, archivedAt, order } = raw;

  if (typeof id !== 'string' || id.length === 0) {
    throw new InvalidBackupError(`${where}.id is missing`);
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidBackupError(`${where}.name is missing`);
  }
  if (!isKnownShape(shape)) throw new InvalidBackupError(`${where}.shape is not a known shape`);
  if (icon !== undefined && !isIconId(icon)) {
    throw new InvalidBackupError(`${where}.icon is not a known icon`);
  }
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) {
    throw new InvalidBackupError(`${where}.color is not a hex colour`);
  }
  if (archivedAt !== undefined && !isValidDateKey(archivedAt)) {
    throw new InvalidBackupError(`${where}.archivedAt is not a date`);
  }
  if (typeof order !== 'number' || !Number.isFinite(order)) {
    throw new InvalidBackupError(`${where}.order is missing`);
  }

  // Older files carry createdAt and activeDays; they are simply dropped.
  const habit: Habit = { id, name, color, shape: resolveShape(shape), order };
  if (icon !== undefined) habit.icon = icon;
  if (archivedAt !== undefined) habit.archivedAt = archivedAt;
  return habit;
}

function parseEntry(raw: unknown, index: number, knownHabits: Set<string>): Entry {
  const where = `entries[${index}]`;
  if (!isRecord(raw)) throw new InvalidBackupError(`${where} is not an object`);

  const { habitId, date, value } = raw;

  if (typeof habitId !== 'string' || !knownHabits.has(habitId)) {
    throw new InvalidBackupError(`${where}.habitId does not match any habit in the file`);
  }
  if (!isValidDateKey(date)) throw new InvalidBackupError(`${where}.date is not a date`);
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new InvalidBackupError(`${where}.value is not a positive number`);
  }

  return { habitId, date, value };
}

function parseSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { theme: 'system' };
  const theme = raw.theme;
  const settings: Settings = {
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
  };
  if (typeof raw.lastBackupAt === 'string') settings.lastBackupAt = raw.lastBackupAt;
  return settings;
}

/** Parses and validates a backup file. Throws rather than partially accepting. */
export function parseBackup(raw: unknown): ExportFile {
  if (!isRecord(raw)) throw new InvalidBackupError('That file isn’t a Day Tracker backup.');

  if (raw.app !== 'day-tracker') {
    throw new InvalidBackupError('That file was written by a different app.');
  }

  const schemaVersion = raw.schemaVersion;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new InvalidBackupError('The file has no usable schema version.');
  }
  if (schemaVersion > SCHEMA_VERSION) {
    throw new InvalidBackupError(
      `This backup came from a newer version of Day Tracker (schema ${schemaVersion}). Update the app first.`,
    );
  }

  if (!Array.isArray(raw.habits)) throw new InvalidBackupError('The file has no habits list.');
  if (!Array.isArray(raw.entries)) throw new InvalidBackupError('The file has no entries list.');

  const habits = raw.habits.map(parseHabit);
  const ids = new Set(habits.map((h) => h.id));
  if (ids.size !== habits.length) throw new InvalidBackupError('Two habits share an id.');

  const entries = raw.entries.map((entry, i) => parseEntry(entry, i, ids));

  const seen = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.habitId}|${entry.date}`;
    if (seen.has(key)) {
      throw new InvalidBackupError(`Two entries cover ${entry.date} for the same habit.`);
    }
    seen.add(key);
  }

  return {
    app: 'day-tracker',
    schemaVersion,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    habits,
    entries,
    settings: parseSettings(raw.settings),
  };
}

export interface MergeSummary {
  habitsAdded: number;
  habitsKept: number;
  entriesAdded: number;
  entriesChanged: number;
}

/**
 * Unions an incoming backup with what's already here.
 *
 * Habits match on id. Where both sides logged the same day, the higher value
 * wins -- a merge should never be able to erase something you did.
 */
export function mergeBackup(
  current: { habits: Habit[]; entries: Entry[]; settings: Settings },
  incoming: ExportFile,
): { result: ExportFile; summary: MergeSummary } {
  const habits = new Map(current.habits.map((h) => [h.id, h]));
  let habitsAdded = 0;
  let habitsKept = 0;

  for (const habit of incoming.habits) {
    if (habits.has(habit.id)) habitsKept += 1;
    else {
      habits.set(habit.id, habit);
      habitsAdded += 1;
    }
  }

  const entries = new Map(current.entries.map((e) => [`${e.habitId}|${e.date}`, e]));
  let entriesAdded = 0;
  let entriesChanged = 0;

  for (const entry of incoming.entries) {
    const key = `${entry.habitId}|${entry.date}`;
    const existing = entries.get(key);
    if (!existing) {
      entries.set(key, entry);
      entriesAdded += 1;
    } else if (entry.value > existing.value) {
      entries.set(key, entry);
      entriesChanged += 1;
    }
  }

  return {
    result: {
      app: 'day-tracker',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      habits: [...habits.values()].sort((a, b) => a.order - b.order),
      entries: [...entries.values()],
      settings: current.settings,
    },
    summary: { habitsAdded, habitsKept, entriesAdded, entriesChanged },
  };
}

/** Days since the last backup, or null if there has never been one. */
export function daysSinceBackup(lastBackupAt: string | undefined, now: Date): number | null {
  if (!lastBackupAt) return null;
  const then = new Date(lastBackupAt);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

export function backupFilename(today: string): string {
  return `day-tracker-backup-${today}.json`;
}
