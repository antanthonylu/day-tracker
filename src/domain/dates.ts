/**
 * Day identity is a *local calendar date*, never a timestamp.
 *
 * Every function here works on the Y/M/D components directly and lets the
 * `Date` constructor normalise overflow in local time. That is what makes the
 * arithmetic survive DST: adding a day across a spring-forward boundary is
 * "the next calendar square", not "+86,400,000 ms".
 */

/** 'YYYY-MM-DD' in the device's local time zone. */
export type DateKey = string;

const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar date of a `Date`, as a DateKey. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Splits a DateKey into its numeric parts. Throws on a malformed key. */
export function parseDateKey(key: DateKey): { year: number; month: number; day: number } {
  if (!isValidDateKey(key)) throw new RangeError(`Not a valid date key: ${key}`);
  return {
    year: Number(key.slice(0, 4)),
    month: Number(key.slice(5, 7)),
    day: Number(key.slice(8, 10)),
  };
}

/**
 * A `Date` at local midday for this key. Midday, not midnight, so that a time
 * zone shifting by an hour can never tip the value into an adjacent day.
 */
export function fromDateKey(key: DateKey): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** True if `key` is 'YYYY-MM-DD' and names a real calendar day. */
export function isValidDateKey(key: unknown): key is DateKey {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) return false;
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  const day = Number(key.slice(8, 10));
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

/** Number of days in a 1-indexed month, leap years included. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, month, 0).getDate();
}

/** Moves `n` calendar days (negative moves back). DST-safe. */
export function addDays(key: DateKey, n: number): DateKey {
  const { year, month, day } = parseDateKey(key);
  return toDateKey(new Date(year, month - 1, day + n, 12));
}

/** Day of week for a key: 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(key: DateKey): number {
  return fromDateKey(key).getDay();
}

/** Whole days from `a` to `b` (`b` later = positive). */
export function daysBetween(a: DateKey, b: DateKey): number {
  const ms = fromDateKey(b).getTime() - fromDateKey(a).getTime();
  // Both ends sit at local midday, so rounding absorbs any DST hour.
  return Math.round(ms / 86_400_000);
}

export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Which day the app should treat as "today".
 *
 * `dayStartsAtHour` shifts the cutover: with 3, anything before 03:00 still
 * belongs to the previous calendar day, so a 2am log lands on the day you'd
 * say it did.
 */
export function todayKey(dayStartsAtHour = 0, now: Date = new Date()): DateKey {
  const key = toDateKey(now);
  return now.getHours() < dayStartsAtHour ? addDays(key, -1) : key;
}
