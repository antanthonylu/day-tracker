import { useEffect, useState } from 'preact/hooks';
import { Sheet } from './Sheet';
import { ManageHabits } from './ManageHabits';
import type { Settings } from '../domain/types';
import { persistence, settings, storageStats, updateSettings } from '../store/store';

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
        <legend>Week starts on</legend>
        <div class="segmented">
          {([0, 1] as const).map((day) => (
            <button
              key={day}
              type="button"
              class={current.weekStartsOn === day ? 'selected' : ''}
              onClick={() => void updateSettings({ weekStartsOn: day })}
            >
              {day === 0 ? 'Sunday' : 'Monday'}
            </button>
          ))}
        </div>
      </fieldset>

      <label class="field">
        <span>Day starts at</span>
        <select
          value={String(current.dayStartsAtHour)}
          onChange={(e) =>
            void updateSettings({ dayStartsAtHour: Number((e.target as HTMLSelectElement).value) })
          }
        >
          {[0, 1, 2, 3, 4, 5, 6].map((hour) => (
            <option key={hour} value={String(hour)}>
              {hour === 0 ? 'Midnight' : `${hour}:00`}
            </option>
          ))}
        </select>
        <p class="hint">
          Anything logged before this hour counts as the previous day — so a 2am entry lands where
          you’d say it did.
        </p>
      </label>

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
        Everything lives on this device only. Deleting the Home Screen icon deletes it all — backup
        and restore arrive in milestone 7.
      </p>

      {managing && <ManageHabits onClose={() => setManaging(false)} />}
    </Sheet>
  );
}
