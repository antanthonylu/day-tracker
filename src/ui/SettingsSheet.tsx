import { useEffect, useState } from 'preact/hooks';
import { Sheet } from './Sheet';
import { ManageHabits } from './ManageHabits';
import { BackupSection } from './BackupSection';
import type { Settings } from '../domain/types';
import {
  importReplace,
  persistence,
  settings,
  storageStats,
  today,
  updateSettings,
} from '../store/store';

const THEMES: { id: Settings['theme']; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const PERSISTENCE_COPY: Record<string, string> = {
  persisted: 'Granted — the browser won’t evict your data to reclaim space.',
  'not-persisted': 'Not granted. Installing to the Home Screen usually earns it.',
  unsupported: 'This browser doesn’t offer it.',
};

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [managing, setManaging] = useState(false);
  const [counts, setCounts] = useState<{ habits: number; entries: number } | null>(null);
  const current = settings.value;

  useEffect(() => {
    void storageStats().then(setCounts);
  }, [managing]);

  return (
    <Sheet title="Settings" onClose={onClose}>
      <fieldset class="field">
        <legend>Theme</legend>
        <div class="segmented">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              class={current.theme === theme.id ? 'selected' : ''}
              onClick={() => void updateSettings({ theme: theme.id })}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </fieldset>

      <BackupSection />

      <h3 class="section-head">Habits</h3>
      <button type="button" class="wide-button" onClick={() => setManaging(true)}>
        Manage habits
      </button>

      <h3 class="section-head">Storage</h3>
      <dl class="stats">
        <dt>Habits</dt>
        <dd>{counts?.habits ?? '—'}</dd>
        <dt>Logged days</dt>
        <dd>{counts?.entries ?? '—'}</dd>
        <dt>Persistent storage</dt>
        <dd>{PERSISTENCE_COPY[persistence.value]}</dd>
        <dt>Last backup</dt>
        <dd>{current.lastBackupAt ? current.lastBackupAt.slice(0, 10) : 'Never'}</dd>
      </dl>
      <p class="hint">
        App version {__APP_VERSION__} · build {__BUILD_TIME__}
      </p>

      {/* Stripped from production builds: import.meta.env.DEV is a compile-time
          constant, so the seed module is never bundled for the real app. */}
      {import.meta.env.DEV && (
        <>
          <h3 class="section-head">Developer</h3>
          <button
            type="button"
            class="wide-button destructive"
            onClick={() => {
              void import('../dev/seed').then(({ demoData }) =>
                importReplace(demoData(today.value)),
              );
            }}
          >
            Replace with demo data
          </button>
          <p class="hint">Ten habits and a year of history, for performance checks.</p>
        </>
      )}

      {managing && <ManageHabits onClose={() => setManaging(false)} />}
    </Sheet>
  );
}
