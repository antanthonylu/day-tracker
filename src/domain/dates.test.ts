import { describe, it, expect } from 'vitest';
import {
  addDays,
  dayOfWeek,
  daysBetween,
  daysInMonth,
  fromDateKey,
  isValidDateKey,
  parseDateKey,
  toDateKey,
  todayKey,
} from './dates';

describe('toDateKey', () => {
  it('formats a local date with zero padding', () => {
    expect(toDateKey(new Date(2026, 0, 5, 9, 30))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('uses local components, not the UTC date', () => {
    // 23:30 local on the 15th is the 16th in UTC for western zones; the key
    // must still say the 15th.
    expect(toDateKey(new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15');
  });
});

describe('isValidDateKey', () => {
  it('accepts real days', () => {
    expect(isValidDateKey('2026-10-15')).toBe(true);
    expect(isValidDateKey('2028-02-29')).toBe(true); // leap year
  });

  it('rejects malformed or impossible days', () => {
    expect(isValidDateKey('2027-02-29')).toBe(false); // not a leap year
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-00-10')).toBe(false);
    expect(isValidDateKey('2026-04-31')).toBe(false);
    expect(isValidDateKey('2026-1-5')).toBe(false);
    expect(isValidDateKey('')).toBe(false);
    expect(isValidDateKey(20261015)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('handles leap years', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28); // century, not divisible by 400
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it('handles 30- and 31-day months', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe('addDays', () => {
  it('moves within a month', () => {
    expect(addDays('2026-10-15', 1)).toBe('2026-10-16');
    expect(addDays('2026-10-15', -1)).toBe('2026-10-14');
    expect(addDays('2026-10-15', 0)).toBe('2026-10-15');
  });

  it('crosses month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01');
  });

  it('crosses year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('crosses leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('crosses DST boundaries without losing or gaining a day', () => {
    // US spring forward 2026-03-08, fall back 2026-11-01.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('spans long stretches', () => {
    expect(addDays('2026-01-01', 365)).toBe('2027-01-01');
    expect(addDays('2028-01-01', 365)).toBe('2028-12-31'); // leap year
  });
});

describe('daysBetween', () => {
  it('counts forwards and backwards', () => {
    expect(daysBetween('2026-10-15', '2026-10-18')).toBe(3);
    expect(daysBetween('2026-10-18', '2026-10-15')).toBe(-3);
    expect(daysBetween('2026-10-15', '2026-10-15')).toBe(0);
  });

  it('is unaffected by a DST transition in the span', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
  });
});

describe('dayOfWeek', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(dayOfWeek('2026-10-11')).toBe(0); // Sunday
    expect(dayOfWeek('2026-10-15')).toBe(4); // Thursday
    expect(dayOfWeek('2026-10-17')).toBe(6); // Saturday
  });
});

describe('parseDateKey / fromDateKey', () => {
  it('round-trips', () => {
    expect(toDateKey(fromDateKey('2026-10-15'))).toBe('2026-10-15');
    expect(parseDateKey('2026-10-15')).toEqual({ year: 2026, month: 10, day: 15 });
  });

  it('throws on a bad key', () => {
    expect(() => parseDateKey('nope')).toThrow(RangeError);
  });
});

describe('todayKey', () => {
  it('returns the plain local date when the day starts at midnight', () => {
    expect(todayKey(0, new Date(2026, 9, 15, 1, 0))).toBe('2026-10-15');
    expect(todayKey(0, new Date(2026, 9, 15, 23, 0))).toBe('2026-10-15');
  });

  it('treats early hours as the previous day when dayStartsAtHour is set', () => {
    expect(todayKey(3, new Date(2026, 9, 15, 2, 0))).toBe('2026-10-14');
    expect(todayKey(3, new Date(2026, 9, 15, 3, 0))).toBe('2026-10-15');
    expect(todayKey(3, new Date(2026, 9, 15, 4, 0))).toBe('2026-10-15');
  });

  it('rolls back across a month boundary', () => {
    expect(todayKey(4, new Date(2026, 10, 1, 1, 30))).toBe('2026-10-31');
  });
});
