import { describe, it, expect } from 'vitest';
import {
  allTimeCompletion,
  bestStreak,
  bestWeekday,
  byWeekday,
  completion,
  currentStreak,
  monthCompletion,
  totalCompletions,
  type EntryLookup,
} from './stats';
import type { Habit } from './types';

const TODAY = '2026-10-15'; // Thursday

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    color: '#2eac84',
    shape: 'blob',
    createdAt: '2026-10-01',
    order: 0,
    ...over,
  };
}

/** Builds a lookup from the days that were marked done. */
function lookupOf(dates: string[]): EntryLookup {
  const set = new Set(dates);
  return (habitId, date) => (set.has(date) ? { habitId, date, value: 1 } : undefined);
}

describe('currentStreak', () => {
  it('counts back from today', () => {
    const look = lookupOf(['2026-10-13', '2026-10-14', '2026-10-15']);
    expect(currentStreak(habit(), TODAY, look)).toBe(3);
  });

  it('does not break just because today is still open', () => {
    // Yesterday and the day before are done; today has not been logged yet.
    const look = lookupOf(['2026-10-13', '2026-10-14']);
    expect(currentStreak(habit(), TODAY, look)).toBe(2);
  });

  it('breaks on a missed day that has already passed', () => {
    const look = lookupOf(['2026-10-12', '2026-10-14', '2026-10-15']);
    expect(currentStreak(habit(), TODAY, look)).toBe(2);
  });

  it('is zero with nothing logged', () => {
    expect(currentStreak(habit(), TODAY, lookupOf([]))).toBe(0);
  });

  it('steps over non-applicable days without breaking', () => {
    // Weekdays only. 10 and 11 Oct are Sat/Sun and must not break the run.
    const h = habit({ activeDays: [1, 2, 3, 4, 5] });
    const look = lookupOf([
      '2026-10-08',
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
    ]);
    expect(currentStreak(h, TODAY, look)).toBe(6);
  });

  it('stops at createdAt', () => {
    const h = habit({ createdAt: '2026-10-14' });
    expect(currentStreak(h, TODAY, lookupOf(['2026-10-14', '2026-10-15']))).toBe(2);
  });

  it('counts across a month boundary', () => {
    const h = habit({ createdAt: '2026-09-01' });
    const look = lookupOf(['2026-09-30', '2026-10-01']);
    expect(currentStreak(h, '2026-10-01', look)).toBe(2);
  });
});

describe('bestStreak', () => {
  it('finds the longest run in history', () => {
    const look = lookupOf([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04', // run of 4
      '2026-10-08',
      '2026-10-09', // run of 2
    ]);
    expect(bestStreak(habit(), TODAY, look)).toBe(4);
  });

  it('counts the current run when it is the longest', () => {
    const look = lookupOf(['2026-10-13', '2026-10-14', '2026-10-15']);
    expect(bestStreak(habit(), TODAY, look)).toBe(3);
  });

  it('is zero with nothing logged', () => {
    expect(bestStreak(habit(), TODAY, lookupOf([]))).toBe(0);
  });

  it('steps over rest days', () => {
    const h = habit({ activeDays: [1, 2, 3, 4, 5] });
    const look = lookupOf(['2026-10-09', '2026-10-12']); // Fri then Mon
    expect(bestStreak(h, TODAY, look)).toBe(2);
  });
});

describe('completion', () => {
  it('counts done over applicable', () => {
    const look = lookupOf(['2026-10-01', '2026-10-02']);
    const result = completion(habit(), '2026-10-01', '2026-10-04', TODAY, look);
    expect(result).toEqual({ done: 2, applicable: 4, rate: 0.5 });
  });

  it('ignores days before the habit existed', () => {
    const h = habit({ createdAt: '2026-10-10' });
    const result = completion(h, '2026-10-01', '2026-10-11', TODAY, lookupOf(['2026-10-10']));
    expect(result.applicable).toBe(2); // only the 10th and 11th
    expect(result.done).toBe(1);
  });

  it('ignores the future', () => {
    const result = completion(habit(), '2026-10-14', '2026-10-20', TODAY, lookupOf([]));
    expect(result.applicable).toBe(2); // 14th and 15th only
  });

  it('ignores rest days', () => {
    const h = habit({ activeDays: [1, 2, 3, 4, 5], createdAt: '2026-10-10' });
    // 10-11 Oct is a weekend; 12-15 are weekdays.
    const result = completion(h, '2026-10-10', '2026-10-15', TODAY, lookupOf([]));
    expect(result.applicable).toBe(4);
  });

  it('reports a zero rate rather than dividing by zero', () => {
    const h = habit({ activeDays: [] });
    expect(completion(h, '2026-10-01', '2026-10-15', TODAY, lookupOf([])).rate).toBe(0);
  });
});

describe('monthCompletion', () => {
  it('scopes to the calendar month', () => {
    const h = habit({ createdAt: '2026-09-01' });
    const look = lookupOf(['2026-09-30', '2026-10-01', '2026-10-02']);
    // October so far is the 1st to the 15th: 15 applicable days, 2 done.
    expect(monthCompletion(h, '2026-10-15', TODAY, look)).toEqual({
      done: 2,
      applicable: 15,
      rate: 2 / 15,
    });
  });
});

describe('allTimeCompletion / totalCompletions', () => {
  it('spans createdAt to today', () => {
    const look = lookupOf(['2026-10-01', '2026-10-05', '2026-10-15']);
    expect(allTimeCompletion(habit(), TODAY, look)).toEqual({
      done: 3,
      applicable: 15,
      rate: 3 / 15,
    });
    expect(totalCompletions(habit(), TODAY, look)).toBe(3);
  });
});

describe('byWeekday / bestWeekday', () => {
  it('rates each weekday and leaves untouched ones null', () => {
    const h = habit({ activeDays: [4], createdAt: '2026-10-01' }); // Thursdays only
    // Thursdays in range: 1, 8, 15 Oct. Two of three done.
    const rates = byWeekday(h, TODAY, lookupOf(['2026-10-01', '2026-10-08']));
    expect(rates[4]).toBeCloseTo(2 / 3);
    expect(rates[0]).toBeNull();
    expect(rates[1]).toBeNull();
  });

  it('picks the strongest weekday', () => {
    const look = lookupOf(['2026-10-05', '2026-10-12']); // both Mondays
    const best = bestWeekday(habit(), TODAY, look);
    expect(best?.day).toBe(1);
    expect(best?.rate).toBe(1);
  });

  it('returns null when nothing has been done', () => {
    expect(bestWeekday(habit(), TODAY, lookupOf([]))).toBeNull();
  });
});
