import { describe, it, expect } from 'vitest';
import { fillFraction, isApplicable, statusOf } from './status';
import type { Entry, Habit } from './types';

const TODAY = '2026-10-15'; // a Thursday

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    color: '#2eac84',
    shape: 'circle',
    kind: 'check',
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
  it('reads a check habit as done or missed', () => {
    const h = habit();
    expect(statusOf(h, entry(1), TODAY, TODAY)).toBe('complete');
    expect(statusOf(h, undefined, TODAY, TODAY)).toBe('missed');
    expect(statusOf(h, entry(0), TODAY, TODAY)).toBe('missed');
  });

  it('reads a count habit against its target', () => {
    const h = habit({ kind: 'count', target: 8, unit: 'glasses' });
    expect(statusOf(h, entry(8), TODAY, TODAY)).toBe('complete');
    expect(statusOf(h, entry(9), TODAY, TODAY)).toBe('complete'); // over target still counts
    expect(statusOf(h, entry(3), TODAY, TODAY)).toBe('partial');
    expect(statusOf(h, entry(0), TODAY, TODAY)).toBe('missed');
    expect(statusOf(h, undefined, TODAY, TODAY)).toBe('missed');
  });

  it('reports na ahead of any value', () => {
    const h = habit({ activeDays: [1] }); // Mondays only
    expect(statusOf(h, entry(1), TODAY, TODAY)).toBe('na');
    expect(statusOf(habit(), entry(1), '2026-12-25', TODAY)).toBe('na');
  });

  it('defaults a count habit with no target to a target of 1', () => {
    const h = habit({ kind: 'count' });
    expect(statusOf(h, entry(1), TODAY, TODAY)).toBe('complete');
  });
});

describe('fillFraction', () => {
  it('is all or nothing for check habits', () => {
    expect(fillFraction(habit(), entry(1))).toBe(1);
    expect(fillFraction(habit(), undefined)).toBe(0);
  });

  it('is proportional for count habits and never exceeds 1', () => {
    const h = habit({ kind: 'count', target: 8 });
    expect(fillFraction(h, entry(2))).toBe(0.25);
    expect(fillFraction(h, entry(4))).toBe(0.5);
    expect(fillFraction(h, entry(8))).toBe(1);
    expect(fillFraction(h, entry(20))).toBe(1);
    expect(fillFraction(h, entry(0))).toBe(0);
  });
});
