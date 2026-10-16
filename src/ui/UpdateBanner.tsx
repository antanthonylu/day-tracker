import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';

/**
 * Updates apply themselves, with no force-quit.
 *
 * The worker is registered with autoUpdate + skipWaiting + clientsClaim, so a
 * new build installs and takes control on its own. The missing piece was the
 * page: it keeps running the old JS until something reloads it. When the new
 * worker claims this page, `controllerchange` fires and we reload once.
 *
 * Reloading under someone's thumb is rude, so it waits for the app to be in
 * the background, or for a moment when nothing is open over the screen.
 */
export function UpdateBanner() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let reloaded = false;

    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    const onControllerChange = () => {
      setUpdating(true);
      if (document.visibilityState === 'hidden') reload();
      // Otherwise give the banner a moment to be seen, then swap.
      else setTimeout(reload, 1200);
    };

    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);

    registerSW({
      immediate: true,
      onRegisteredSW: (_url, registration) => {
        // Re-check whenever the app comes back to the foreground, so a Home
        // Screen app that is never closed still picks up new builds.
        const check = () => {
          if (document.visibilityState === 'visible') void registration?.update();
        };
        document.addEventListener('visibilitychange', check);
        check();
      },
    });

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!updating) return null;

  return (
    <div class="banner update-banner" role="status">
      <span>Updating…</span>
    </div>
  );
}
