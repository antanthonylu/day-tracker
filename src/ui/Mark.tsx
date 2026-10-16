import { SHAPE_PATHS } from '../domain/shapes';
import type { DayStatus, ShapeId } from '../domain/types';

interface Props {
  shape: ShapeId;
  color: string;
  status: DayStatus;
  size?: number;
  isToday?: boolean;
  title?: string;
}

/**
 * One habit on one day.
 *
 * Done fills, missed is a faint outline, and a day the habit never applied to
 * is a neutral dot -- quiet enough that an empty Saturday doesn't read as a
 * failure.
 */
export function Mark({ shape, color, status, size = 28, isToday, title }: Props) {
  const d = SHAPE_PATHS[shape];

  if (status === 'na') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" class="mark" aria-hidden="true">
        {/* Visible enough that an untouched month still reads as a grid of
            days, faint enough that it never looks like a miss. */}
        <circle cx="50" cy="50" r="9" fill="currentColor" opacity="0.38" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      class="mark"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
    >
      {title && <title>{title}</title>}

      {isToday && (
        <circle cx="50" cy="50" r="47" fill="none" stroke={color} stroke-width="3" opacity="0.35" />
      )}

      <g transform={isToday ? 'translate(50,50) scale(0.8) translate(-50,-50)' : undefined}>
        {status === 'complete' ? (
          <path d={d} fill={color} fill-rule="evenodd" />
        ) : (
          <path
            d={d}
            fill="none"
            stroke={color}
            stroke-width="7"
            stroke-linejoin="round"
            opacity="0.4"
            fill-rule="evenodd"
          />
        )}
      </g>
    </svg>
  );
}
