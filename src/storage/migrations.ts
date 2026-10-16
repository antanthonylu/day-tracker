import { resolveShape } from '../domain/shapes';
import type { ExportFile } from '../domain/types';
import { SCHEMA_VERSION } from '../domain/types';

/** One function per version step, applied in order. */
type Migration = (data: ExportFile) => ExportFile;

const MIGRATIONS: Record<number, Migration> = {
  /**
   * v1 -> v2: the shape vocabulary was reworked and six names were dropped
   * (circle, square, diamond, triangle, hexagon, plus). Habits saved under the
   * old names resolved to no path at all and drew nothing, so a day could be
   * logged and look identical either way. Each one is rewritten to its nearest
   * survivor, and the count habits that v1 allowed collapse to plain marks.
   */
  2: (data) => ({
    ...data,
    schemaVersion: 2,
    habits: data.habits.map((habit) => {
      const migrated = { ...habit, shape: resolveShape(habit.shape) };
      for (const dead of ['kind', 'target', 'unit', 'step'] as const) {
        delete (migrated as Record<string, unknown>)[dead];
      }
      return migrated;
    }),
    // A count habit's partial days become plain done/not-done.
    entries: data.entries.map((entry) => ({ ...entry, value: entry.value >= 1 ? 1 : 0 })),
  }),

  /**
   * v2 -> v3: start dates and rest-day schedules are gone. Both existed to
   * say "this day doesn't count", and between them a habit could end up
   * applicable on no day at all -- every cell disabled, every tap ignored,
   * nothing on screen explaining why. Only the future is off limits now.
   */
  3: (data) => ({
    ...data,
    schemaVersion: 3,
    habits: data.habits.map((habit) => {
      const migrated = { ...habit };
      for (const dead of ['createdAt', 'activeDays'] as const) {
        delete (migrated as Record<string, unknown>)[dead];
      }
      return migrated;
    }),
  }),
};

export class UnsupportedSchemaError extends Error {
  constructor(version: number) {
    super(
      `This backup was written by a newer version of Day Tracker (schema ${version}, this build understands ${SCHEMA_VERSION}). Update the app, then import again.`,
    );
    this.name = 'UnsupportedSchemaError';
  }
}

/** Brings an export file up to the current schema, or throws if it can't. */
export function migrate(data: ExportFile): ExportFile {
  let current = data;

  if (current.schemaVersion > SCHEMA_VERSION) {
    throw new UnsupportedSchemaError(current.schemaVersion);
  }

  while (current.schemaVersion < SCHEMA_VERSION) {
    const next = current.schemaVersion + 1;
    const step = MIGRATIONS[next];
    if (!step) throw new Error(`No migration to schema version ${next}`);
    current = step(current);
  }

  return current;
}
