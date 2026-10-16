import { useEffect, useState } from 'preact/hooks';
import { TabBar, type TabId } from './TabBar';
import { UpdateBanner } from './UpdateBanner';
import { BackupBanner } from './BackupBanner';
import { SettingsSheet } from './SettingsSheet';
import { HabitSheet } from './HabitSheet';
import { Log } from './screens/Log';
import { Month } from './screens/Month';
import { Year } from './screens/Year';
import { Insights } from './screens/Insights';
import { load, loadError, ready, refreshToday } from '../store/store';

const TITLES: Record<TabId, string> = {
  log: 'Log',
  month: 'Month',
  year: 'Year',
  insights: 'Insights',
};

export function App() {
  const [tab, setTab] = useState<TabId>('log');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adding, setAdding] = useState(false);

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
        <div class="topbar-actions">
          <button
            class="icon-button"
            type="button"
            aria-label="New habit"
            onClick={() => setAdding(true)}
          >
            <PlusIcon />
          </button>
          <button
            class="icon-button"
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
        </div>
      </header>

      <main class={`screen screen-${tab}`}>
        {!ready.value ? null : loadError.value ? (
          <p class="notice error">Couldn’t open your data: {loadError.value}</p>
        ) : (
          <>
            {tab === 'log' && <Log />}
            {tab === 'month' && <Month />}
            {tab === 'year' && <Year />}
            {tab === 'insights' && <Insights />}
          </>
        )}
      </main>

      <BackupBanner />
      <UpdateBanner />
      <TabBar active={tab} onChange={setTab} />

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {adding && <HabitSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
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
