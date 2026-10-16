import { useState } from 'preact/hooks';
import { daysSinceBackup } from '../domain/backup';
import { entries, settings } from '../store/store';

const NAG_AFTER_DAYS = 30;
/** Don't mention backups until there is enough logged to be worth losing. */
const MIN_ENTRIES = 20;
const DISMISS_KEY = 'day-tracker:backup-nag-dismissed';
const DISMISS_DAYS = 30;

function dismissedRecently(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    if (!at) return false;
    return Date.now() - Number(at) < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * A reminder, not a nag.
 *
 * It used to appear on a brand-new install with nothing logged, and "Later"
 * only lasted until the next launch, so it was back every time the app
 * opened. Now it waits until there is real data to lose, and Later is
 * remembered for a month.
 */
export function BackupBanner() {
  const [dismissed, setDismissed] = useState(dismissedRecently);
  const days = daysSinceBackup(settings.value.lastBackupAt, new Date());

  const enoughToLose = entries.value.size >= MIN_ENTRIES;
  const stale = days === null || days >= NAG_AFTER_DAYS;
  if (dismissed || !enoughToLose || !stale) return null;

  function later() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private browsing can refuse; dismissing for this session is enough.
    }
    setDismissed(true);
  }

  return (
    <div class="banner backup-banner" role="status">
      <span>
        {days === null
          ? 'No backup yet — your data lives only on this phone.'
          : `Last backup was ${days} days ago.`}
      </span>
      <button type="button" class="dismiss" onClick={later}>
        Later
      </button>
    </div>
  );
}
