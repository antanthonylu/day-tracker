import { describe, it, expect } from 'vitest';
import { isApplicable, isDone, statusOf } from './status';
import type { Entry, Habit } from './types';

const TODAY = '2026-10-15'; // a Thursday

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    color: '#2eac84',
    shape: 'blob',
    createdAt: '2026-01-01',
    order: 0,
    ...over,
  };
}

function entry(value: number): Entry {
  return { habitId: 'h1', date: TODAY, value };
}

describe('isApplicable', () => {
  it('covers days from createdAt up to today', () => {
    const h = habit({ createdAt: '2026-10-10' });
    expect(isApplicable(h, '2026-10-09', TODAY)).toBe(false);
    expect(isApplicable(h, '2026-10-10', TODAY)).toBe(true);
    expect(isApplicable(h, TODAY, TODAY)).toBe(true);
  });

  it('excludes the future', () => {
    expect(isApplicable(habit(), '2026-10-16', TODAY)).toBe(false);
    expect(isApplicable(habit(), '2027-01-01', TODAY)).toBe(false);
  });

  it('excludes days from the archive date onward', () => {
    const h = habit({ archivedAt: '2026-10-12' });
    expect(isApplicable(h, '2026-10-11', TODAY)).toBe(true);
    expect(isApplicable(h, '2026-10-12', TODAY)).toBe(false);
    expect(isApplicable(h, '2026-10-13', TODAY)).toBe(false);
  });

  it('honours an active-day schedule', () => {
    // Weekdays only: Monday(1) through Friday(5).
    const h = habit({ activeDays: [1, 2, 3, 4, 5] });
    expect(isApplicable(h, '2026-10-15', TODAY)).toBe(true); // Thursday
    expect(isApplicable(h, '2026-10-10', TODAY)).toBe(false); // Saturday
    expect(isApplicable(h, '2026-10-11', TODAY)).toBe(false); // Sunday
    expect(isApplicable(h, '2026-10-12', TODAY)).toBe(true); // Monday
  });

  it('treats an empty schedule as never applicable', () => {
    expect(isApplicable(habit({ activeDays: [] }), TODAY, TODAY)).toBe(false);
  });
});

describe('statusOf', () => {
  it('is done or missed', () => {
    const h = habit();
    expect(statusOf(h, entry(1), TODAY, TODAY)).toBe('complete');
    expect(statusOf(h, undefined, TODAY, TODAY)).toBe('missed');
    expect(statusOf(h, entry(0), TODAY, TODAY)).toBe('missed');
  });

  it('reports na ahead of any value', () => {
    const h = habit({ activeDays: [1] }); // Mondays only
    expect(statusOf(h, entry(1), TODAY, TODAY)).toBe('na');
    expect(statusOf(habit(), entry(1), '2026-12-25', TODAY)).toBe('na');
    expect(statusOf(habit({ createdAt: '2026-10-20' }), entry(1), TODAY, TODAY)).toBe('na');
  });
});

describe('isDone', () => {
  it('reads the entry value', () => {
    expect(isDone(entry(1))).toBe(true);
    expect(isDone(entry(0))).toBe(false);
    expect(isDone(undefined)).toBe(false);
  });
});
