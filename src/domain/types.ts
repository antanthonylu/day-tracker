import type { DateKey } from './dates';
import type { IconId } from './icons';
import type { ShapeId } from './shapes';

export type { DateKey, IconId, ShapeId };
export type HabitId = string;

export interface Habit {
  id: HabitId;
  name: string;
  color: string;
  /** The abstract mark stamped into every day cell. */
  shape: ShapeId;
  /** The pictogram in the column header. Falls back to the shape when unset. */
  icon?: IconId;
  archivedAt?: DateKey;
  order: number;
}

/** One row per habit per day that was done. Absent = not done. */
export interface Entry {
  habitId: HabitId;
  date: DateKey;
  /** 1 means done. The field stays numeric so a future kind of habit can use it. */
  value: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  lastBackupAt?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
};

/**
 * Weeks start on Sunday and a day starts at midnight, always. These were
 * settings once; fixing them keeps every calendar in the app aligned and
 * leaves one less thing to get wrong.
 */
export const WEEK_STARTS_ON = 0;
export const DAY_STARTS_AT_HOUR = 0;

/** The canonical full-state document: what export writes and import reads. */
export interface ExportFile {
  app: 'day-tracker';
  schemaVersion: number;
  exportedAt: string;
  habits: Habit[];
  entries: Entry[];
  settings: Settings;
}

export const SCHEMA_VERSION = 3;

/**
 * How a habit stands on one day.
 *
 * 'na' now means one thing only: the day hasn't happened yet. Every past day
 * is loggable for every habit. Start dates and rest-day schedules used to
 * produce 'na' too, and a habit could end up unloggable on every single day
 * with nothing on screen to say why.
 */
export type DayStatus = 'complete' | 'missed' | 'na';
