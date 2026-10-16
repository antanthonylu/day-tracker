import { ICON_PATHS } from '../domain/icons';
import { SHAPE_PATHS } from '../domain/shapes';
import type { DayStatus, IconId, ShapeId } from '../domain/types';

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
 * Every state draws the same silhouette, so a column reads as one shape
 * filling in rather than a mix of shapes and dots:
 *   done    - solid in the habit's colour
 *   missed  - the empty outline, in the habit's colour
 *   n/a     - the empty outline in neutral grey, for a day the habit was never
 *             due: before you created it, a rest day, or one still to come
 */
export function Mark({ shape, color, status, size = 28, isToday, title }: Props) {
  const d = SHAPE_PATHS[shape];
  const neutral = status === 'na';

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

      {isToday && !neutral && (
        <circle cx="50" cy="50" r="47" fill="none" stroke={color} stroke-width="3" opacity="0.35" />
      )}

      <g
        transform={
          isToday && !neutral ? 'translate(50,50) scale(0.8) translate(-50,-50)' : undefined
        }
      >
        {status === 'complete' ? (
          <path d={d} fill={color} fill-rule="evenodd" />
        ) : (
          <path
            d={d}
            fill="none"
            stroke={neutral ? 'currentColor' : color}
            stroke-width={neutral ? 5 : 7}
            stroke-linejoin="round"
            opacity={neutral ? 0.3 : 0.45}
            fill-rule="evenodd"
          />
        )}
      </g>
    </svg>
  );
}

/**
 * The habit's badge at the top of its column.
 *
 * Shows the habit's pictogram, so a glance at the header says "gym" rather
 * than "red blob". Deliberately not the same thing as a logged cell: it sits
 * in a tinted tile, so reading down a column can't mistake the header for a
 * day you ticked. Habits saved before icons existed fall back to their shape.
 */
export function HabitBadge({
  shape,
  icon,
  color,
  size = 20,
}: {
  shape: ShapeId;
  icon?: IconId;
  color: string;
  size?: number;
}) {
  return (
    <span
      class="habit-badge"
      style={{
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
      }}
    >
      {icon ? (
        <HabitIcon icon={icon} color={color} size={size} />
      ) : (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d={SHAPE_PATHS[shape]} fill={color} fill-rule="evenodd" />
        </svg>
      )}
    </span>
  );
}

/** A pictogram on its own, for the icon picker and habit headers. */
export function HabitIcon({
  icon,
  color,
  size = 20,
}: {
  icon: IconId;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[icon].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
