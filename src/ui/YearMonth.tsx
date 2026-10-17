import { useEffect, useRef } from 'preact/hooks';
import { monthGrid, parseDateKey, startOfMonth } from '../domain/dates';
import type { PieDay } from '../domain/pie';
import { SHAPE_PATHS } from '../domain/shapes';
import { statusOf } from '../domain/status';
import { WEEK_STARTS_ON, type DateKey, type Habit } from '../domain/types';
import { entryFor, today } from '../store/store';

interface Props {
  month: DateKey;
  pies?: Map<DateKey, PieDay>;
  habit?: Habit;
  onPick?: (date: DateKey) => void;
}

/**
 * One mini-month, drawn to a canvas rather than built from components.
 *
 * A year of these as SVG is roughly four thousand nodes, and opening the tab
 * stalled for over a second. The pixels are identical; the difference is that
 * the browser has twelve elements to lay out instead of thousands.
 */
export function YearMonth({ month, pies, habit, onPick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const anchor = startOfMonth(month);
  const days = monthGrid(anchor, WEEK_STARTS_ON);
  const rows = days.length / 7;
  const now = today.value;
  // Re-draw when any of these change; the signal reads below subscribe us.
  const signature = days
    .map((d) =>
      habit
        ? statusOf(habit, entryFor(habit.id, d), d, now)
        : (pies?.get(d)?.slots.join(',') ?? ''),
    )
    .join('|');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = canvas.clientWidth;
    const cell = width / 7;
    const height = cell * rows;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const faint = getComputedStyle(canvas).getPropertyValue('color') || '#888';
    const { month: monthNumber } = parseDateKey(anchor);
    const radius = cell * 0.34;

    days.forEach((date, index) => {
      if (parseDateKey(date).month !== monthNumber) return;

      const cx = (index % 7) * cell + cell / 2;
      const cy = Math.floor(index / 7) * cell + cell / 2;

      if (habit) {
        const status = statusOf(habit, entryFor(habit.id, date), date, now);
        if (status === 'na') {
          dot(ctx, cx, cy, cell, faint);
          return;
        }
        ctx.save();
        const scale = (radius * 2) / 100;
        ctx.translate(cx - radius, cy - radius);
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
        return;
      }

      const day = pies?.get(date);
      if (!day || day.total === 0) {
        dot(ctx, cx, cy, cell, faint);
        return;
      }

      ctx.strokeStyle = faint;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = Math.max(1, cell * 0.05);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Index, not order of completion: each habit owns the same slice on
      // every day, so where a colour sits tells you which habit it is.
      const slice = (Math.PI * 2) / day.total;
      day.slots.forEach((color, i) => {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, -Math.PI / 2 + i * slice, -Math.PI / 2 + (i + 1) * slice);
        ctx.closePath();
        ctx.fill();
      });
    });
  }, [signature, rows, anchor, habit, now, days, pies]);

  function pick(event: MouseEvent) {
    const canvas = ref.current;
    if (!canvas || !onPick) return;
    const box = canvas.getBoundingClientRect();
    const cell = box.width / 7;
    const column = Math.floor((event.clientX - box.left) / cell);
    const row = Math.floor((event.clientY - box.top) / cell);
    const date = days[row * 7 + column];
    if (date && parseDateKey(date).month === parseDateKey(anchor).month) onPick(date);
  }

  return (
    <canvas
      ref={ref}
      class="year-canvas"
      onClick={pick}
      role="img"
      aria-label={`${anchor.slice(0, 7)} calendar`}
    />
  );
}

function dot(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number, color: string) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.38;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, cell * 0.07), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
