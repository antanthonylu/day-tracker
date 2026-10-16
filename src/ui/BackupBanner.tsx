import { useState } from 'preact/hooks';
import { daysSinceBackup } from '../domain/backup';
import { settings } from '../store/store';

const NAG_AFTER_DAYS = 30;

/**
 * A quiet reminder, not an alarm.
 *
 * The data lives in one place and deleting the Home Screen icon takes it with
 * it, so a backup that is a month old is worth mentioning once -- and worth
 * being dismissible, because nagging about it every launch is how people
 * learn to ignore a warning.
 */
export function BackupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const last = settings.value.lastBackupAt;
  const days = daysSinceBackup(last, new Date());

  const stale = days === null || days >= NAG_AFTER_DAYS;
  if (dismissed || !stale) return null;

  return (
    <div class="banner backup-banner" role="status">
      <span>
        {days === null
          ? 'No backup yet. Your data lives only on this phone.'
          : `Last backup was ${days} days ago.`}
      </span>
      <button type="button" class="dismiss" onClick={() => setDismissed(true)}>
        Later
      </button>
    </div>
  );
}
