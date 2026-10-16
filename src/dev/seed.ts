import { addDays, startOfYear } from '../domain/dates';
import { PALETTE } from '../domain/palette';
import { SHAPE_IDS } from '../domain/shapes';
import { SCHEMA_VERSION, type Entry, type ExportFile, type Habit } from '../domain/types';

/**
 * A year of plausible data for ten habits, to check the year grid stays smooth
 * under a realistic load (acceptance checklist, HANDOFF §13).
 *
 * Dev only: the button that calls this is behind `import.meta.env.DEV`, so the
 * whole module is dropped from a production build.
 */
export function demoData(today: string): ExportFile {
  const names = [
    'Exercise',
    'Read',
    'Walk',
    'Stretch',
    'Write',
    'Meditate',
    'Water plants',
    'Practice',
    'Tidy',
    'Early night',
  ];

  const start = startOfYear(today);

  const habits: Habit[] = names.map((name, i) => ({
    id: `demo-${i}`,
    name,
    color: PALETTE[(i * 5) % PALETTE.length]!.hex,
    shape: SHAPE_IDS[i % SHAPE_IDS.length]!,
    order: i,
  }));

  const entries: Entry[] = [];
  // A deterministic pseudo-random sequence, so the demo looks the same twice.
  let seed = 20261015;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (const habit of habits) {
    // Each habit gets its own rough adherence, so the ranking is interesting.
    const adherence = 0.45 + random() * 0.45;
    for (let date = start; date <= today; date = addDays(date, 1)) {
      if (random() < adherence) entries.push({ habitId: habit.id, date, value: 1 });
    }
  }

  return {
    app: 'day-tracker',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    habits,
    entries,
    settings: { theme: 'system' },
  };
}
