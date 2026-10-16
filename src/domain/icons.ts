/**
 * Pictograms that say what a habit *is*.
 *
 * Distinct from `ShapeId`, which is the abstract mark stamped into every day
 * cell: at 10px in the year grid a dumbbell is an unreadable smudge, so the
 * grids stay geometric and the recognisable picture lives in the column header
 * where there is room for it.
 *
 * Drawn as stroke paths on a 24 box, so they inherit colour and line weight
 * and stay crisp at any size.
 */

export type IconId =
  | 'dumbbell'
  | 'run'
  | 'walk'
  | 'bike'
  | 'meditate'
  | 'book'
  | 'pen'
  | 'briefcase'
  | 'laptop'
  | 'music'
  | 'palette'
  | 'chat'
  | 'droplet'
  | 'apple'
  | 'pill'
  | 'moon'
  | 'sunrise'
  | 'heart'
  | 'bulb'
  | 'coin'
  | 'home'
  | 'plant'
  | 'nophone'
  | 'tooth';

export const ICON_IDS: readonly IconId[] = [
  'dumbbell',
  'run',
  'walk',
  'bike',
  'meditate',
  'book',
  'pen',
  'briefcase',
  'laptop',
  'music',
  'palette',
  'chat',
  'droplet',
  'apple',
  'pill',
  'moon',
  'sunrise',
  'heart',
  'bulb',
  'coin',
  'home',
  'plant',
  'nophone',
  'tooth',
] as const;

/** Each icon is one or more stroked subpaths on a 0-24 grid. */
export const ICON_PATHS: Record<IconId, string[]> = {
  dumbbell: ['M4 9.5v5M7 7v10M17 7v10M20 9.5v5M7 12h10'],
  run: [
    'M17.3 4.6a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z',
    'M14 8.5l-3 3.8 2 3.7-1 4',
    'M14 9.6l-4-1M13.6 10.2l3.6 1.6M11 12.3l-3.8 2.8',
  ],
  walk: [
    'M14.3 4.6a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z',
    'M12.6 8.5L11 13.4l2 3.1-.6 4',
    'M12.8 9.6l2.6 1.6M12.3 9.4l-2.6 1.4M11 13.4l-2.4 3.4',
  ],
  bike: [
    'M9.5 17.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M22.5 17.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M5.5 17.5L10 9.5h5M10 9.5l4 8M14 9.5h3.5M18.5 17.5L15.5 11',
  ],
  meditate: [
    'M13.9 5.1a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0z',
    'M12 8.6c-2 0-3.2 1.9-3.4 3.9M12 8.6c2 0 3.2 1.9 3.4 3.9',
    'M6.2 17.8c1.2-2 3.4-3 5.8-3s4.6 1 5.8 3z',
    'M8.7 12.6L6.6 16.1M15.3 12.6l2.1 3.5',
  ],
  book: [
    'M12 6.6C10.4 5.1 8 4.6 4 4.6v12.8c4 0 6.4.5 8 2 1.6-1.5 4-2 8-2V4.6c-4 0-6.4.5-8 2z',
    'M12 6.6v12.8',
  ],
  pen: ['M4 20l1-4.2L16.6 4.2a2.1 2.1 0 0 1 3 3L8 18.9z', 'M14.6 6.2l3.2 3.2'],
  briefcase: [
    'M3.5 8h17v11h-17z',
    'M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2',
    'M3.5 12.8h17',
  ],
  laptop: ['M5 6h14v9.2H5z', 'M2.5 18.6h19l-1.6-3.4H4.1z'],
  music: [
    'M9 17.6V6.1l10-2v11.5',
    'M9 17.6a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z',
    'M19 15.6a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z',
  ],
  palette: [
    'M12 3.6a8.4 8.4 0 0 0 0 16.8c1.4 0 2.1-1 2.1-1.9 0-1.6-1.3-1.8-1.3-2.8 0-.8.7-1.5 1.5-1.5h1.5a4.6 4.6 0 0 0 4.6-4.6c0-3.3-3.8-6-8.4-6z',
    'M8.6 10.4a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0zM12.9 7.9a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0zM17 10.4a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0z',
  ],
  chat: ['M20.2 11.8a7.6 7.6 0 0 1-11 6.8L4 20.2l1.4-5.1A7.6 7.6 0 1 1 20.2 11.8z'],
  droplet: ['M12 3.4c0 0 6 6.4 6 10a6 6 0 1 1-12 0c0-3.6 6-10 6-10z'],
  apple: [
    'M12 8.2c-1-2-3.1-2.6-4.7-1.5C5.2 8 4.7 11.5 6.2 15c1 2.3 2.4 3.9 3.9 3.9.8 0 1.2-.4 1.9-.4s1.1.4 1.9.4c1.5 0 2.9-1.6 3.9-3.9 1.5-3.5 1-7-.9-8.3-1.7-1.1-3.8-.5-4.9 1.5z',
    'M12 8.2V5.4M12 5.4c1.4 0 2.4-1 2.4-2.1',
  ],
  pill: ['M9.6 4.6a4.9 4.9 0 0 1 7 7l-5 5a4.9 4.9 0 1 1-7-7z', 'M7.2 16.8L16.6 7.4'],
  moon: ['M20 14.6A8.5 8.5 0 0 1 9.4 4 8.5 8.5 0 1 0 20 14.6z'],
  sunrise: [
    'M12 3.6v3.2M5.4 9.6l2.2 2.2M2.4 16h3.2M18.4 16h3.2M16.4 11.8l2.2-2.2',
    'M8 16a4 4 0 0 1 8 0',
    'M2.4 20h19.2',
  ],
  heart: [
    'M12 20.2S4.3 15.2 4.3 10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.7 2.8c0 5.1-7.7 10.1-7.7 10.1z',
  ],
  bulb: [
    'M8 12.6a4.4 4.4 0 1 1 8 0c-.9 1.3-1.6 2.1-1.6 3.6H9.6c0-1.5-.7-2.3-1.6-3.6z',
    'M9.6 18.4h4.8M10.6 21h2.8',
  ],
  coin: [
    'M20.4 12a8.4 8.4 0 1 1-16.8 0 8.4 8.4 0 0 1 16.8 0z',
    'M14.6 9.4c-.5-1-1.5-1.6-2.6-1.6-1.5 0-2.6.9-2.6 2.1s1.1 1.8 2.6 2.1 2.6.9 2.6 2.1-1.1 2.1-2.6 2.1c-1.1 0-2.1-.6-2.6-1.6',
    'M12 6.4v11.2',
  ],
  home: ['M3.8 10.4L12 4l8.2 6.4V20H3.8z', 'M9.4 20v-6h5.2v6'],
  plant: [
    'M6.8 13.6h10.4l-1.1 6.6H7.9z',
    'M12 13.6V9.2',
    'M12 11.4C12 9 10.2 7.2 7.8 7.2c0 2.4 1.8 4.2 4.2 4.2z',
    'M12 10.4c0-2.4 1.8-4.2 4.2-4.2 0 2.4-1.8 4.2-4.2 4.2z',
  ],
  nophone: ['M7 2.8h10v18.4H7z', 'M10.2 5.6h3.6', 'M4 3.6l16 16.8'],
  tooth: [
    'M12 6c-2-1.7-5.8-1.6-6.8 1.1-1 2.6.6 4.6 1 7.2.4 2.1.3 5.2 1.9 5.2 1.7 0 1.2-4.2 3.9-4.2s2.2 4.2 3.9 4.2c1.6 0 1.5-3.1 1.9-5.2.4-2.6 2-4.6 1-7.2C18.8 4.4 14 4.3 12 6z',
  ],
};

export const ICON_LABELS: Record<IconId, string> = {
  dumbbell: 'Dumbbell',
  run: 'Running',
  walk: 'Walking',
  bike: 'Cycling',
  meditate: 'Meditation',
  book: 'Reading',
  pen: 'Writing',
  briefcase: 'Work',
  laptop: 'Computer',
  music: 'Music',
  palette: 'Art',
  chat: 'Language',
  droplet: 'Water',
  apple: 'Food',
  pill: 'Medication',
  moon: 'Sleep',
  sunrise: 'Morning',
  heart: 'Health',
  bulb: 'Learning',
  coin: 'Money',
  home: 'Chores',
  plant: 'Garden',
  nophone: 'Screen time',
  tooth: 'Teeth',
};

export function isIconId(value: unknown): value is IconId {
  return typeof value === 'string' && value in ICON_PATHS;
}
