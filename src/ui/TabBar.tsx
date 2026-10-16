export type TabId = 'today' | 'month' | 'year' | 'insights';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: () => preact.JSX.Element }[] = [
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'month', label: 'Month', icon: MonthIcon },
  { id: 'year', label: 'Year', icon: YearIcon },
  { id: 'insights', label: 'Insights', icon: InsightsIcon },
];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav class="tabbar" aria-label="Main">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          class="tab"
          type="button"
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1.6,
  'stroke-linecap': 'round' as const,
  'stroke-linejoin': 'round' as const,
};

function TodayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MonthIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8.5 3.5v3M15.5 3.5v3" />
    </svg>
  );
}

function YearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <path d="M4 19.5V11M10 19.5V5M16 19.5v-6M21 19.5h-18" />
    </svg>
  );
}
