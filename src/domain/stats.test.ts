import { describe, it, expect } from 'vitest';
import {
  allTimeCompletion,
  bestWeekday,
  byWeekday,
  completion,
  monthCompletion,
  yearCompletion,
  type EntryLookup,
} from './stats';
import type { Habit } from './types';

const TODAY = '2026-10-15'; // Thursday

function habit(over: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Read', color: '#2eac84', shape: 'blob', order: 0, ...over };
}

/** Builds a lookup from the days that were marked done. */
function lookupOf(dates: string[]): EntryLookup {
  const set = new Set(dates);
  return (habitId, date) => (set.has(date) ? { habitId, date, value: 1 } : undefined);
}

describe('completion', () => {
  it('counts done over days elapsed', () => {
    const result = completion(
      habit(),
      '2026-10-01',
      '2026-10-04',
      TODAY,
      lookupOf(['2026-10-01', '2026-10-02']),
    );
    expect(result).toEqual({ done: 2, days: 4, rate: 0.5 });
  });

  it('stops at today rather than counting the rest of the period', () => {
    const result = completion(habit(), '2026-10-14', '2026-10-20', TODAY, lookupOf([]));
    expect(result.days).toBe(2); // the 14th and 15th only
  });

  it('counts every past day, with no schedule to exempt one', () => {
    // 10-11 Oct is a weekend; it counts like any other day now.
    const result = completion(habit(), '2026-10-10', '2026-10-15', TODAY, lookupOf([]));
    expect(result.days).toBe(6);
  });

  it('is zero rather than dividing by zero when nothing has elapsed', () => {
    expect(completion(habit(), '2026-11-01', '2026-11-30', TODAY, lookupOf([])).rate).toBe(0);
  });

  it('spans a month boundary', () => {
    const result = completion(
      habit(),
      '2026-09-29',
      '2026-10-02',
      TODAY,
      lookupOf(['2026-09-30', '2026-10-01']),
    );
    expect(result).toEqual({ done: 2, days: 4, rate: 0.5 });
  });
});

describe('monthCompletion', () => {
  it('scopes to the calendar month, up to today', () => {
    const look = lookupOf(['2026-09-30', '2026-10-01', '2026-10-02']);
    expect(monthCompletion(habit(), '2026-10-15', TODAY, look)).toEqual({
      done: 2,
      days: 15,
      rate: 2 / 15,
    });
  });

  it('counts a whole month once it is in the past', () => {
    expect(monthCompletion(habit(), '2026-09-10', TODAY, lookupOf([])).days).toBe(30);
  });

  it('handles a leap February', () => {
    expect(monthCompletion(habit(), '2028-02-10', '2028-12-31', lookupOf([])).days).toBe(29);
  });
});

describe('yearCompletion', () => {
  it('runs from 1 January to today', () => {
    expect(yearCompletion(habit(), '2026-06-15', TODAY, lookupOf([])).days).toBe(288);
  });
});

describe('allTimeCompletion', () => {
  it('spans the given start to today', () => {
    const look = lookupOf(['2026-10-01', '2026-10-05', '2026-10-15']);
    expect(allTimeCompletion(habit(), '2026-10-01', TODAY, look)).toEqual({
      done: 3,
      days: 15,
      rate: 3 / 15,
    });
  });
});

describe('byWeekday / bestWeekday', () => {
  it('rates each weekday', () => {
    // Thursdays from 1 to 15 Oct: the 1st, 8th and 15th. Two of three done.
    const rates = byWeekday(habit(), '2026-10-01', TODAY, lookupOf(['2026-10-01', '2026-10-08']));
    expect(rates[4]).toBeCloseTo(2 / 3);
  });

  it('leaves a weekday with no elapsed days as null', () => {
    const rates = byWeekday(habit(), TODAY, TODAY, lookupOf([]));
    expect(rates[4]).toBe(0); // Thursday elapsed
    expect(rates[0]).toBeNull(); // Sunday did not
  });

  it('picks the strongest weekday', () => {
    const best = bestWeekday(habit(), '2026-10-01', TODAY, lookupOf(['2026-10-05', '2026-10-12']));
    expect(best?.day).toBe(1); // Monday
    expect(best?.rate).toBe(1);
  });

  it('returns null when nothing has been done', () => {
    expect(bestWeekday(habit(), '2026-10-01', TODAY, lookupOf([]))).toBeNull();
  });
});
