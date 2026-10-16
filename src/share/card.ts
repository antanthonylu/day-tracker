import { monthGrid, monthLabel, parseDateKey, startOfMonth } from '../domain/dates';
import { SHAPE_PATHS } from '../domain/shapes';
import { statusOf } from '../domain/status';
import { monthCompletion, type EntryLookup } from '../domain/stats';
import { WEEK_STARTS_ON, type DateKey, type Habit } from '../domain/types';

const WIDTH = 1080;
const HEIGHT = 1350;
const BG = '#101215';
const TEXT = '#e8e6e3';
const DIM = '#6b7178';

/**
 * Draws one habit's month as a shareable image.
 *
 * The shapes come from the same path definitions the app renders, via Path2D,
 * so the card can never drift from what you see on screen.
 */
export function drawShareCard(
  habit: Habit,
  month: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const anchor = startOfMonth(month);
  const { month: monthNumber } = parseDateKey(anchor);
  const stats = monthCompletion(habit, anchor, today, lookup);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TEXT;
  ctx.font = '600 64px ui-monospace, "JetBrains Mono", monospace';
  ctx.fillText(habit.name, 90, 170);

  ctx.fillStyle = DIM;
  ctx.font = '400 38px ui-monospace, "JetBrains Mono", monospace';
  ctx.fillText(monthLabel(anchor), 90, 232);

  const days = monthGrid(anchor, WEEK_STARTS_ON);
  const cell = 128;
  const gridLeft = (WIDTH - cell * 7) / 2;
  const gridTop = 330;

  days.forEach((date, index) => {
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = gridLeft + column * cell;
    const y = gridTop + row * cell;

    if (parseDateKey(date).month !== monthNumber) return;

    const status = statusOf(habit, lookup(habit.id, date), date, today);
    if (status === 'na') {
      ctx.fillStyle = DIM;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    ctx.save();
    // Paths are authored in a 0-100 box; scale that into the cell.
    const inset = 18;
    const scale = (cell - inset * 2) / 100;
    ctx.translate(x + inset, y + inset);
    ctx.scale(scale, scale);

    const path = new Path2D(SHAPE_PATHS[habit.shape]);
    if (status === 'complete') {
      ctx.fillStyle = habit.color;
      ctx.fill(path, 'evenodd');
    } else {
      ctx.strokeStyle = habit.color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      ctx.stroke(path);
    }
    ctx.restore();
  });

  const footerY = HEIGHT - 150;
  ctx.fillStyle = TEXT;
  ctx.font = '600 86px ui-monospace, "JetBrains Mono", monospace';
  ctx.fillText(`${Math.round(stats.rate * 100)}%`, 90, footerY);

  ctx.fillStyle = DIM;
  ctx.font = '400 34px ui-monospace, "JetBrains Mono", monospace';
  ctx.fillText(`${stats.done} of ${stats.applicable} days`, 90, footerY + 50);

  ctx.textAlign = 'right';
  ctx.fillText('Day Tracker', WIDTH - 90, footerY + 50);
  ctx.textAlign = 'left';

  return canvas;
}

/** Shares the card as a PNG, falling back to a download. */
export async function shareCard(
  habit: Habit,
  month: DateKey,
  today: DateKey,
  lookup: EntryLookup,
): Promise<void> {
  const canvas = drawShareCard(habit, month, today, lookup);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not render the card');

  const name = `${habit.name.toLowerCase().replace(/\s+/g, '-')}-${month.slice(0, 7)}.png`;
  const file = new File([blob], name, { type: 'image/png' });

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${habit.name} — ${monthLabel(month)}` });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
