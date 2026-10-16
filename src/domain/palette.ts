/**
 * Sixteen habit colours, each mid-toned on purpose: light enough to read on the
 * near-black dark background, dark enough to read on the cream light one, so a
 * habit keeps its identity when the phone flips theme at sunset.
 */

export interface PaletteColor {
  hex: string;
  name: string;
}

export const PALETTE: readonly PaletteColor[] = [
  { hex: '#e05549', name: 'Red' },
  { hex: '#e07f3a', name: 'Orange' },
  { hex: '#d9a62e', name: 'Amber' },
  { hex: '#a8b32c', name: 'Lime' },
  { hex: '#4fa852', name: 'Green' },
  { hex: '#2eac84', name: 'Emerald' },
  { hex: '#26a9a3', name: 'Teal' },
  { hex: '#2f9fc4', name: 'Cyan' },
  { hex: '#4a8fd4', name: 'Blue' },
  { hex: '#6f7fd8', name: 'Indigo' },
  { hex: '#9271d4', name: 'Violet' },
  { hex: '#b065c8', name: 'Purple' },
  { hex: '#cf5fa8', name: 'Magenta' },
  { hex: '#dd5f84', name: 'Pink' },
  { hex: '#a07a5c', name: 'Brown' },
  { hex: '#7b8794', name: 'Slate' },
] as const;

export const DEFAULT_COLOR = PALETTE[5]!.hex;

export function isPaletteColor(value: unknown): value is string {
  return typeof value === 'string' && PALETTE.some((c) => c.hex === value);
}

/** The colour to suggest for the nth habit, so a new list isn't all one hue. */
export function nextColor(usedCount: number): string {
  // Step by 5 so consecutive habits land far apart on the wheel.
  return PALETTE[(usedCount * 5) % PALETTE.length]!.hex;
}
