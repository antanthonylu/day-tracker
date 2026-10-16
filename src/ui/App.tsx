import { useEffect, useState } from 'preact/hooks';
import { TabBar, type TabId } from './TabBar';
import { UpdateBanner } from './UpdateBanner';
import { SettingsSheet } from './SettingsSheet';
import { Today } from './screens/Today';
import { Month } from './screens/Month';
import { Year } from './screens/Year';
import { Insights } from './screens/Insights';
import { load, loadError, ready, refreshToday } from '../store/store';

const TITLES: Record<TabId, string> = {
  today: 'Today',
  month: 'Month',
  year: 'Year',
  insights: 'Insights',
};

export function App() {
  const [tab, setTab] = useState<TabId>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void load();

    // A PWA is suspended rather than closed, so an app left open overnight
    // would still believe it is yesterday without this.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshToday();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return (
    <div class="app-shell">
      <header class="topbar">
        <h1>{TITLES[tab]}</h1>
        <button
          class="icon-button"
          type="button"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <GearIcon />
        </button>
      </header>

      <main class="screen">
        {!ready.value ? null : loadError.value ? (
          <p class="notice error">Couldn’t open your data: {loadError.value}</p>
        ) : (
          <>
            {tab === 'today' && <Today />}
            {tab === 'month' && <Month />}
            {tab === 'year' && <Year />}
            {tab === 'insights' && <Insights />}
          </>
        )}
      </main>

      <UpdateBanner />
      <TabBar active={tab} onChange={setTab} />

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
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
