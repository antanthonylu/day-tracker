import { describe, it, expect } from 'vitest';
import { isApplicable, isDone, statusOf } from './status';
import type { Entry, Habit } from './types';

const TODAY = '2026-10-15'; // a Thursday

function habit(over: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Read', color: '#2eac84', shape: 'blob', order: 0, ...over };
}

function entry(value: number, date = TODAY): Entry {
  return { habitId: 'h1', date, value };
}

describe('isApplicable', () => {
  it('allows today and every day before it', () => {
    expect(isApplicable(habit(), TODAY, TODAY)).toBe(true);
    expect(isApplicable(habit(), '2026-10-14', TODAY)).toBe(true);
    expect(isApplicable(habit(), '2020-01-01', TODAY)).toBe(true);
  });

  it('refuses the future, and only the future', () => {
    expect(isApplicable(habit(), '2026-10-16', TODAY)).toBe(false);
    expect(isApplicable(habit(), '2027-01-01', TODAY)).toBe(false);
  });

  it('allows weekends like any other day', () => {
    expect(isApplicable(habit(), '2026-10-10', TODAY)).toBe(true); // Saturday
    expect(isApplicable(habit(), '2026-10-11', TODAY)).toBe(true); // Sunday
  });
});

describe('statusOf', () => {
  it('is done or missed', () => {
    expect(statusOf(habit(), entry(1), TODAY, TODAY)).toBe('complete');
    expect(statusOf(habit(), undefined, TODAY, TODAY)).toBe('missed');
    expect(statusOf(habit(), entry(0), TODAY, TODAY)).toBe('missed');
  });

  it('reports na for the future only', () => {
    expect(statusOf(habit(), undefined, '2026-12-25', TODAY)).toBe('na');
    expect(statusOf(habit(), undefined, '2026-10-10', TODAY)).toBe('missed');
  });
});

describe('isDone', () => {
  it('reads the entry value', () => {
    expect(isDone(entry(1))).toBe(true);
    expect(isDone(entry(0))).toBe(false);
    expect(isDone(undefined)).toBe(false);
  });
});
