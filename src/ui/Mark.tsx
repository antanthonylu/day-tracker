import { useMemo } from 'preact/hooks';
import { SHAPE_PATHS } from '../domain/shapes';
import type { DayStatus, ShapeId } from '../domain/types';

let clipSeq = 0;

interface Props {
  shape: ShapeId;
  color: string;
  status: DayStatus;
  /** 0..1, only consulted when status is 'partial'. */
  fill?: number;
  size?: number;
  isToday?: boolean;
  title?: string;
}

/**
 * One habit on one day.
 *
 * Complete fills, partial fills from the bottom like a measuring glass, missed
 * is a faint outline, and a day the habit never applied to is a neutral dot --
 * quiet enough that an empty Saturday doesn't read as a failure.
 */
export function Mark({ shape, color, status, fill = 0, size = 28, isToday, title }: Props) {
  const clipId = useMemo(() => `mk${(clipSeq += 1)}`, []);
  const d = SHAPE_PATHS[shape];

  if (status === 'na') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" class="mark" aria-hidden="true">
        {title && <title>{title}</title>}
        <circle cx="50" cy="50" r="7" fill="currentColor" opacity="0.22" />
      </svg>
    );
  }

  // The level is clipped off the top, so the shape fills upward as the count climbs.
  const level = 100 - Math.round(Math.max(0, Math.min(1, fill)) * 100);
  const inner = isToday ? 'translate(50,50) scale(0.8) translate(-50,-50)' : undefined;

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

      <g transform={inner}>
        {status === 'complete' ? (
          <path d={d} fill={color} />
        ) : (
          <>
            <path
              d={d}
              fill="none"
              stroke={color}
              stroke-width="7"
              stroke-linejoin="round"
              opacity={status === 'partial' ? 0.9 : 0.4}
            />
            {status === 'partial' && fill > 0 && (
              <>
                <clipPath id={clipId}>
                  <rect x="0" y={level} width="100" height={100 - level} />
                </clipPath>
                <path d={d} fill={color} clip-path={`url(#${clipId})`} opacity="0.85" />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}
