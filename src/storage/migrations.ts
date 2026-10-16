import type { ExportFile } from '../domain/types';
import { SCHEMA_VERSION } from '../domain/types';

/**
 * One function per version step, applied in order.
 *
 * v1 is the first schema, so there is nothing to migrate yet. The runner
 * exists from day one anyway: the moment a real migration is needed there will
 * already be backup files in the wild written by an older build, and the place
 * to handle them has to be here rather than invented under pressure.
 */
type Migration = (data: ExportFile) => ExportFile;

const MIGRATIONS: Record<number, Migration> = {
  // 2: (data) => ({ ...data, schemaVersion: 2, /* ... */ }),
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
