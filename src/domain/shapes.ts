/**
 * The twelve marks a habit can wear.
 *
 * Every path is drawn in the same 0-100 box and is a single closed subpath, so
 * one definition serves the SVG grids, the outline and partial-fill states, and
 * (via `new Path2D(d)`) the canvas share card.
 *
 * Shapes carry meaning on their own: two habits must stay apart for someone who
 * can't separate their colours, so the set is chosen for silhouettes that stay
 * distinct at the ~10px the year grid draws them at.
 */

export type ShapeId =
  | 'circle'
  | 'square'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'star'
  | 'heart'
  | 'moon'
  | 'drop'
  | 'bolt'
  | 'leaf'
  | 'plus';

export const SHAPE_IDS: readonly ShapeId[] = [
  'circle',
  'square',
  'diamond',
  'triangle',
  'hexagon',
  'star',
  'heart',
  'moon',
  'drop',
  'bolt',
  'leaf',
  'plus',
] as const;

export const SHAPE_PATHS: Record<ShapeId, string> = {
  circle: 'M6 50 A44 44 0 1 0 94 50 A44 44 0 1 0 6 50 Z',
  square:
    'M20 8 H80 A12 12 0 0 1 92 20 V80 A12 12 0 0 1 80 92 H20 A12 12 0 0 1 8 80 V20 A12 12 0 0 1 20 8 Z',
  diamond: 'M50 5 L95 50 L50 95 L5 50 Z',
  triangle: 'M50 8 L93 86 H7 Z',
  hexagon: 'M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z',
  star: 'M50 5 L60.6 35.4 L92.8 36.1 L67.1 55.6 L76.5 86.4 L50 68 L23.5 86.4 L32.9 55.6 L7.2 36.1 L39.4 35.4 Z',
  heart:
    'M50 88 C50 88 10 60 10 34 C10 18 24 10 36 10 C44 10 50 16 50 22 C50 16 56 10 64 10 C76 10 90 18 90 34 C90 60 50 88 50 88 Z',
  moon: 'M62 9 C35 16 17 32 17 50 C17 68 35 84 62 91 C41 80 31 66 31 50 C31 34 41 20 62 9 Z',
  drop: 'M50 6 C50 6 84 42 84 62 A34 34 0 1 1 16 62 C16 42 50 6 50 6 Z',
  bolt: 'M58 5 L20 55 H44 L40 95 L80 43 H54 Z',
  leaf: 'M50 6 C78 26 88 52 50 94 C12 52 22 26 50 6 Z',
  plus: 'M38 8 H62 V38 H92 V62 H62 V92 H38 V62 H8 V38 H38 Z',
};

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: 'Circle',
  square: 'Square',
  diamond: 'Diamond',
  triangle: 'Triangle',
  hexagon: 'Hexagon',
  star: 'Star',
  heart: 'Heart',
  moon: 'Moon',
  drop: 'Drop',
  bolt: 'Bolt',
  leaf: 'Leaf',
  plus: 'Plus',
};

export function isShapeId(value: unknown): value is ShapeId {
  return typeof value === 'string' && value in SHAPE_PATHS;
}

export function shapePath(shape: ShapeId): string {
  return SHAPE_PATHS[shape];
}
