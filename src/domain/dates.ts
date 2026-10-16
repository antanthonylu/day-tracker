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

/* ---- month and range helpers ---- */

/** Every day of a 1-indexed month, in order. */
export function daysOfMonth(year: number, month: number): DateKey[] {
  const count = daysInMonth(year, month);
  const days: DateKey[] = [];
  for (let day = 1; day <= count; day += 1) {
    days.push(`${year}-${pad(month)}-${pad(day)}`);
  }
  return days;
}

/** First day of the month a key falls in. */
export function startOfMonth(key: DateKey): DateKey {
  const { year, month } = parseDateKey(key);
  return `${year}-${pad(month)}-01`;
}

/** First day of the calendar year a key falls in. */
export function startOfYear(key: DateKey): DateKey {
  return `${parseDateKey(key).year}-01-01`;
}

/**
 * Moves whole months, clamping the day to the shortest month rather than
 * spilling over: 31 Jan plus one month is 28 Feb, not 3 March.
 */
export function addMonths(key: DateKey, n: number): DateKey {
  const { year, month, day } = parseDateKey(key);
  const zero = year * 12 + (month - 1) + n;
  const newYear = Math.floor(zero / 12);
  const newMonth = (zero % 12) + 1;
  return `${newYear}-${pad(newMonth)}-${pad(Math.min(day, daysInMonth(newYear, newMonth)))}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function monthLabel(key: DateKey, style: 'long' | 'short' = 'long'): string {
  const { year, month } = parseDateKey(key);
  const name = MONTH_NAMES[month - 1]!;
  return `${style === 'short' ? name.slice(0, 3) : name} ${year}`;
}

export function dayName(key: DateKey, style: 'long' | 'short' | 'narrow' = 'short'): string {
  const name = DAY_NAMES[dayOfWeek(key)]!;
  if (style === 'long') return name;
  if (style === 'narrow') return name.slice(0, 1);
  return name.slice(0, 3);
}

/** '15 Oct' — the compact form used in the date switcher. */
export function shortDateLabel(key: DateKey): string {
  const { month, day } = parseDateKey(key);
  return `${day} ${MONTH_NAMES[month - 1]!.slice(0, 3)}`;
}

/** The `length` days ending at `endKey`, oldest first. */
export function lastNDays(endKey: DateKey, length: number): DateKey[] {
  const days: DateKey[] = [];
  for (let i = length - 1; i >= 0; i -= 1) days.push(addDays(endKey, -i));
  return days;
}

export function clampDateKey(key: DateKey, min: DateKey, max: DateKey): DateKey {
  if (key < min) return min;
  if (key > max) return max;
  return key;
}

/**
 * How far back the date and month switchers may travel.
 *
 * Always at least 1 January of the current year, so this year's calendar is
 * reachable from day one, and further still if a habit was created before that
 * or an imported backup carries older entries.
 */
export function earliestNavigableDate(today: DateKey, earliestData?: DateKey): DateKey {
  const yearStart = startOfYear(today);
  if (earliestData && earliestData < yearStart) return startOfYear(earliestData);
  return yearStart;
}
