/**
 * The twelve marks a habit can wear.
 *
 * Every path is drawn in the same 0-100 box, so one definition serves the SVG
 * grids, the outline state, and (via `new Path2D(d)`) the canvas share card.
 *
 * The set is chosen for silhouettes that stay apart at the ~10px the year grid
 * draws them at, and no two share a family: one organic blob, one rounded
 * square, a faceted gem, two very different stars, a pierced ring, a capsule,
 * and five natural forms. Shapes carry meaning on their own, so two habits stay
 * distinguishable for someone who can't separate their colours.
 */

export type ShapeId =
  | 'blob'
  | 'squircle'
  | 'gem'
  | 'star'
  | 'sparkle'
  | 'ring'
  | 'pill'
  | 'heart'
  | 'moon'
  | 'drop'
  | 'bolt'
  | 'leaf';

export const SHAPE_IDS: readonly ShapeId[] = [
  'blob',
  'squircle',
  'gem',
  'star',
  'sparkle',
  'ring',
  'pill',
  'heart',
  'moon',
  'drop',
  'bolt',
  'leaf',
] as const;

export const SHAPE_PATHS: Record<ShapeId, string> = {
  // Lopsided on purpose -- a perfect circle would read as "no shape chosen".
  blob: 'M58 6 C80 8 96 26 92 50 C88 74 72 96 48 94 C26 92 8 72 7 48 C6 26 36 4 58 6 Z',
  // Flat sides with rounded corners, so it stays a square next to the blob
  // rather than melting into another round thing at 10px.
  squircle:
    'M2 38 C2 12 12 2 38 2 L62 2 C88 2 98 12 98 38 L98 62 C98 88 88 98 62 98 L38 98 C12 98 2 88 2 62 Z',
  gem: 'M30 8 H70 L92 38 L50 94 L8 38 Z',
  star: 'M50 3 L61.2 34.6 L94.7 35.5 L68.1 55.9 L77.6 88 L50 69 L22.4 88 L31.9 55.9 L5.3 35.5 L38.8 34.6 Z',
  // Four points with concave sides -- unmistakable against the five-point star.
  sparkle: 'M50 3 Q56 44 97 50 Q56 56 50 97 Q44 56 3 50 Q44 44 50 3 Z',
  // Drawn as two subpaths and filled even-odd, which punches out the middle.
  ring: 'M50 6 A44 44 0 1 0 50 94 A44 44 0 1 0 50 6 Z M50 28 A22 22 0 1 1 50 72 A22 22 0 1 1 50 28 Z',
  pill: 'M30 18 H70 A32 32 0 0 1 70 82 H30 A32 32 0 0 1 30 18 Z',
  heart:
    'M50 88 C50 88 10 60 10 34 C10 18 24 10 36 10 C44 10 50 16 50 22 C50 16 56 10 64 10 C76 10 90 18 90 34 C90 60 50 88 50 88 Z',
  moon: 'M62 9 C35 16 17 32 17 50 C17 68 35 84 62 91 C41 80 31 66 31 50 C31 34 41 20 62 9 Z',
  drop: 'M50 6 C50 6 84 42 84 62 A34 34 0 1 1 16 62 C16 42 50 6 50 6 Z',
  bolt: 'M58 5 L20 55 H44 L40 95 L80 43 H54 Z',
  leaf: 'M50 6 C78 26 88 52 50 94 C12 52 22 26 50 6 Z',
};

export const SHAPE_LABELS: Record<ShapeId, string> = {
  blob: 'Blob',
  squircle: 'Squircle',
  gem: 'Gem',
  star: 'Star',
  sparkle: 'Sparkle',
  ring: 'Ring',
  pill: 'Pill',
  heart: 'Heart',
  moon: 'Moon',
  drop: 'Drop',
  bolt: 'Bolt',
  leaf: 'Leaf',
};

export function isShapeId(value: unknown): value is ShapeId {
  return typeof value === 'string' && value in SHAPE_PATHS;
}

export function shapePath(shape: ShapeId): string {
  return SHAPE_PATHS[shape];
}
