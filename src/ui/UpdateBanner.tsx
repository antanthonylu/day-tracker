import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';

/**
 * The service worker is registered with `registerType: 'prompt'`, so a new
 * build never swaps itself in mid-session. It waits here until you say so,
 * which keeps a reload from happening under your thumb while you're logging.
 */
export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
    });
    setUpdateSW(() => update);
  }, []);

  if (!needRefresh) return null;

  return (
    <div class="update-banner" role="status">
      <span>Update available</span>
      <button class="dismiss" type="button" onClick={() => setNeedRefresh(false)}>
        Later
      </button>
      <button type="button" onClick={() => void updateSW?.()}>
        Reload
      </button>
    </div>
  );
}
