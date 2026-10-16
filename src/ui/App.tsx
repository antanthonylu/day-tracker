import { useState } from 'preact/hooks';
import { TabBar, type TabId } from './TabBar';
import { UpdateBanner } from './UpdateBanner';
import { Today } from './screens/Today';
import { Month } from './screens/Month';
import { Year } from './screens/Year';
import { Insights } from './screens/Insights';

const TITLES: Record<TabId, string> = {
  today: 'Today',
  month: 'Month',
  year: 'Year',
  insights: 'Insights',
};

export function App() {
  const [tab, setTab] = useState<TabId>('today');

  return (
    <div class="app-shell">
      <header class="topbar">
        <h1>{TITLES[tab]}</h1>
        <button class="icon-button" type="button" aria-label="Settings">
          <GearIcon />
        </button>
      </header>

      <main class="screen">
        {tab === 'today' && <Today />}
        {tab === 'month' && <Month />}
        {tab === 'year' && <Year />}
        {tab === 'insights' && <Insights />}
      </main>

      <UpdateBanner />
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" />
    </svg>
  );
}
