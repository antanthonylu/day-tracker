import { useRef, useState } from 'preact/hooks';
import { InvalidBackupError, parseBackup } from '../domain/backup';
import { migrate } from '../storage/migrations';
import type { ExportFile } from '../domain/types';
import { exportBackup, importMerge, importReplace } from '../store/store';
import { Sheet } from './Sheet';

export function BackupSection() {
  const picker = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<ExportFile | null>(null);

  async function onExport() {
    try {
      const how = await exportBackup();
      setStatus(how === 'shared' ? 'Backup shared.' : 'Backup downloaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed.');
    }
  }

  async function onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // so picking the same file twice still fires
    if (!file) return;

    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      // Older files are brought forward before anything is shown or applied.
      setPending(migrate(parsed));
      setStatus(null);
    } catch (error) {
      setPending(null);
      setStatus(
        error instanceof InvalidBackupError
          ? error.message
          : error instanceof SyntaxError
            ? 'That file isn’t valid JSON.'
            : 'Couldn’t read that file.',
      );
    }
  }

  return (
    <>
      <h3 class="section-head">Backup</h3>
      <p class="hint">
        Your data lives on this phone only. Export regularly — deleting the Home Screen icon deletes
        everything with it.
      </p>

      <div class="button-row">
        <button type="button" class="wide-button" onClick={() => void onExport()}>
          Export backup
        </button>
        <button type="button" class="wide-button" onClick={() => picker.current?.click()}>
          Import backup
        </button>
      </div>

      <input
        ref={picker}
        type="file"
        accept="application/json,.json"
        class="visually-hidden"
        onChange={(e) => void onFile(e)}
      />

      {status && <p class="hint status">{status}</p>}

      {pending && (
        <ImportSheet
          file={pending}
          onClose={() => setPending(null)}
          onDone={(message) => {
            setPending(null);
            setStatus(message);
          }}
        />
      )}
    </>
  );
}

function ImportSheet({
  file,
  onClose,
  onDone,
}: {
  file: ExportFile;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function run(mode: 'replace' | 'merge') {
    setBusy(true);
    try {
      if (mode === 'replace') {
        await importReplace(file);
        onDone(`Replaced everything with ${file.habits.length} habits.`);
      } else {
        const summary = await importMerge(file);
        onDone(
          `Merged: ${summary.habitsAdded} new habits, ${summary.entriesAdded} new days, ${summary.entriesChanged} updated.`,
        );
      }
    } catch (error) {
      onDone(error instanceof Error ? error.message : 'Import failed.');
    }
  }

  return (
    <Sheet title="Import backup" onClose={onClose}>
      <dl class="stats">
        <dt>Written</dt>
        <dd>{file.exportedAt.slice(0, 10)}</dd>
        <dt>Habits</dt>
        <dd>{file.habits.length}</dd>
        <dt>Logged days</dt>
        <dd>{file.entries.length}</dd>
      </dl>

      <p class="hint">
        <strong>Replace</strong> discards everything here and uses the file instead.{' '}
        <strong>Merge</strong> keeps both, and where the same day appears twice the higher value
        wins — a merge can’t erase something you did.
      </p>

      <div class="button-row">
        <button type="button" class="wide-button" disabled={busy} onClick={() => void run('merge')}>
          Merge
        </button>
        <button
          type="button"
          class="wide-button destructive"
          disabled={busy}
          onClick={() => void run('replace')}
        >
          Replace all
        </button>
      </div>
    </Sheet>
  );
}
