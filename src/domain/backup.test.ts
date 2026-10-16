import { describe, it, expect } from 'vitest';
import { InvalidBackupError, daysSinceBackup, mergeBackup, parseBackup } from './backup';
import type { ExportFile, Habit } from './types';

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    color: '#2eac84',
    shape: 'blob',
    order: 0,
    ...over,
  };
}

function file(over: Partial<ExportFile> = {}): ExportFile {
  return {
    app: 'day-tracker',
    schemaVersion: 1,
    exportedAt: '2026-10-15T00:00:00.000Z',
    habits: [habit()],
    entries: [{ habitId: 'h1', date: '2026-10-02', value: 1 }],
    settings: { theme: 'system' },
    ...over,
  };
}

describe('parseBackup', () => {
  it('accepts a well-formed file', () => {
    const parsed = parseBackup(file());
    expect(parsed.habits).toHaveLength(1);
    expect(parsed.entries).toHaveLength(1);
  });

  it('round-trips through JSON', () => {
    expect(parseBackup(JSON.parse(JSON.stringify(file())))).toEqual(file());
  });

  it('rejects a file from another app', () => {
    expect(() => parseBackup({ ...file(), app: 'other-tracker' })).toThrow(InvalidBackupError);
  });

  it('rejects non-objects', () => {
    expect(() => parseBackup(null)).toThrow(InvalidBackupError);
    expect(() => parseBackup('nope')).toThrow(InvalidBackupError);
    expect(() => parseBackup([])).toThrow(InvalidBackupError);
  });

  it('rejects a newer schema rather than guessing', () => {
    expect(() => parseBackup({ ...file(), schemaVersion: 99 })).toThrow(/newer version/);
  });

  it('rejects an unknown shape', () => {
    const bad = file({ habits: [{ ...habit(), shape: 'trapezoid' } as unknown as Habit] });
    expect(() => parseBackup(bad)).toThrow(/shape/);
  });

  it('accepts an older file and drops the fields that no longer exist', () => {
    const old = {
      ...file(),
      schemaVersion: 1,
      habits: [{ ...habit(), shape: 'circle', createdAt: '2026-10-01', activeDays: [1, 2] }],
    };
    const parsed = parseBackup(old);
    // 'circle' was dropped from the shape set; it maps to its nearest survivor
    // rather than being rejected or left to render as nothing.
    expect(parsed.habits[0]!.shape).toBe('blob');
    expect(parsed.habits[0]).not.toHaveProperty('createdAt');
    expect(parsed.habits[0]).not.toHaveProperty('activeDays');
  });

  it('rejects an entry pointing at a habit that is not in the file', () => {
    const bad = file({ entries: [{ habitId: 'ghost', date: '2026-10-02', value: 1 }] });
    expect(() => parseBackup(bad)).toThrow(/habitId/);
  });

  it('rejects duplicate habit ids', () => {
    expect(() => parseBackup(file({ habits: [habit(), habit()] }))).toThrow(/share an id/);
  });

  it('rejects two entries for the same habit and day', () => {
    const bad = file({
      entries: [
        { habitId: 'h1', date: '2026-10-02', value: 1 },
        { habitId: 'h1', date: '2026-10-02', value: 1 },
      ],
    });
    expect(() => parseBackup(bad)).toThrow(/Two entries/);
  });

  it('still rejects a shape it has never heard of', () => {
    const bad = file({ habits: [{ ...habit(), shape: 'trapezoid' } as unknown as Habit] });
    expect(() => parseBackup(bad)).toThrow(/shape/);
  });

  it('falls back to a sane theme', () => {
    const parsed = parseBackup(file({ settings: { theme: 'neon' } as never }));
    expect(parsed.settings.theme).toBe('system');
  });
});

describe('mergeBackup', () => {
  const current = {
    habits: [habit()],
    entries: [{ habitId: 'h1', date: '2026-10-02', value: 1 }],
    settings: { theme: 'dark' as const },
  };

  it('adds habits it has never seen', () => {
    const incoming = file({ habits: [habit(), habit({ id: 'h2', name: 'Walk', order: 1 })] });
    const { result, summary } = mergeBackup(current, incoming);
    expect(result.habits).toHaveLength(2);
    expect(summary).toMatchObject({ habitsAdded: 1, habitsKept: 1 });
  });

  it('adds entries it has never seen', () => {
    const incoming = file({ entries: [{ habitId: 'h1', date: '2026-10-05', value: 1 }] });
    const { result, summary } = mergeBackup(current, incoming);
    expect(result.entries).toHaveLength(2);
    expect(summary.entriesAdded).toBe(1);
  });

  it('never lowers a value on conflict', () => {
    const incoming = file({ entries: [{ habitId: 'h1', date: '2026-10-02', value: 0 }] });
    const { result, summary } = mergeBackup(current, incoming);
    expect(result.entries[0]!.value).toBe(1);
    expect(summary.entriesChanged).toBe(0);
  });

  it('raises a value on conflict', () => {
    const incoming = file({ entries: [{ habitId: 'h1', date: '2026-10-02', value: 5 }] });
    const { result, summary } = mergeBackup(current, incoming);
    expect(result.entries[0]!.value).toBe(5);
    expect(summary.entriesChanged).toBe(1);
  });

  it('keeps the local settings', () => {
    const { result } = mergeBackup(current, file());
    expect(result.settings.theme).toBe('dark');
  });
});

describe('daysSinceBackup', () => {
  const now = new Date('2026-10-15T12:00:00.000Z');

  it('is null when there has never been one', () => {
    expect(daysSinceBackup(undefined, now)).toBeNull();
    expect(daysSinceBackup('not a date', now)).toBeNull();
  });

  it('counts whole days', () => {
    expect(daysSinceBackup('2026-10-15T00:00:00.000Z', now)).toBe(0);
    expect(daysSinceBackup('2026-10-14T00:00:00.000Z', now)).toBe(1);
    expect(daysSinceBackup('2026-09-15T12:00:00.000Z', now)).toBe(30);
  });
});
