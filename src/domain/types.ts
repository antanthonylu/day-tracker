import type { DateKey } from './dates';
import type { ShapeId } from './shapes';

export type { DateKey, ShapeId };
export type HabitId = string;

export type HabitKind = 'check' | 'count';

export interface Habit {
  id: HabitId;
  name: string;
  color: string;
  shape: ShapeId;
  kind: HabitKind;
  /** count habits: how many make a day complete. */
  target?: number;
  /** count habits: what you're counting ('glasses', 'min'). */
  unit?: string;
  /** count habits: how much one tap adds. Defaults to 1. */
  step?: number;
  /** 0-6, Sunday first. Undefined means every day. */
  activeDays?: number[];
  /** Stats and streaks start here; earlier days are not applicable. */
  createdAt: DateKey;
  archivedAt?: DateKey;
  order: number;
}

/** One row per habit per day that has a value. Absent = nothing logged. */
export interface Entry {
  habitId: HabitId;
  date: DateKey;
  /** check: 1 means done. count: the running amount. */
  value: number;
}

export interface Settings {
  weekStartsOn: 0 | 1;
  /** 0-6. With 3, anything logged before 3am lands on the previous day. */
  dayStartsAtHour: number;
  theme: 'system' | 'light' | 'dark';
  lastBackupAt?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  weekStartsOn: 0,
  dayStartsAtHour: 0,
  theme: 'system',
};

/** The canonical full-state document: what export writes and import reads. */
export interface ExportFile {
  app: 'day-tracker';
  schemaVersion: number;
  exportedAt: string;
  habits: Habit[];
  entries: Entry[];
  settings: Settings;
}

export const SCHEMA_VERSION = 1;

/** How a habit stands on one day. */
export type DayStatus = 'complete' | 'partial' | 'missed' | 'na';

/** What a count habit adds per tap. */
export function stepOf(habit: Habit): number {
  return habit.step && habit.step > 0 ? habit.step : 1;
}

/** What a count habit needs to call a day done. */
export function targetOf(habit: Habit): number {
  if (habit.kind === 'check') return 1;
  return habit.target && habit.target > 0 ? habit.target : 1;
}
