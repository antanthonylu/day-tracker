import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';

/**
 * The service worker updates itself now (registerType: 'autoUpdate'), so there
 * is nothing to approve -- a new build is in place by the next launch.
 *
 * This only reports it, because an app that silently swaps underneath you is
 * unsettling, and because knowing a build landed is the difference between
 * "the fix didn't work" and "the fix never arrived".
 */
export function UpdateBanner() {
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    registerSW({
      immediate: true,
      onRegisteredSW: (_url, registration) => {
        // Check again when the app comes back to the foreground, so a Home
        // Screen app that is never closed still picks up new builds.
        const check = () => {
          if (document.visibilityState === 'visible') void registration?.update();
        };
        document.addEventListener('visibilitychange', check);
      },
      onNeedRefresh: () => setUpdated(true),
    });
  }, []);

  if (!updated) return null;

  return (
    <div class="banner update-banner" role="status">
      <span>Updating to the latest version…</span>
    </div>
  );
}
