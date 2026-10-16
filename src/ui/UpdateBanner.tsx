import { useEffect, useState } from 'preact/hooks';

/**
 * Updates apply themselves, with no force-quit.
 *
 * The worker is registered with autoUpdate + skipWaiting + clientsClaim, so a
 * new build installs and takes control on its own. The missing piece was the
 * page: it keeps running the old JavaScript until something reloads it. When
 * the new worker claims this page, `controllerchange` fires and we reload.
 *
 * All of it is deferred past the first frame. Registering pulls in the
 * Workbox runtime and checking for a new build is a network round trip, and
 * launch is the one moment neither is welcome -- everything needed to draw
 * the app is already in the cache.
 */
export function UpdateBanner() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let reloaded = false;
    let cancelled = false;

    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    const onControllerChange = () => {
      setUpdating(true);
      // Reloading under someone's thumb is rude: swap straight away if the
      // app is in the background, otherwise give the notice a moment.
      if (document.visibilityState === 'hidden') reload();
      else setTimeout(reload, 1200);
    };

    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);

    const timer = setTimeout(() => {
      if (cancelled) return;
      void import('virtual:pwa-register').then(({ registerSW }) => {
        if (cancelled) return;
        registerSW({
          immediate: true,
          onRegisteredSW: (_url, registration) => {
            // Re-check when the app returns to the foreground, so a Home
            // Screen app that is never closed still picks up new builds.
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') void registration?.update();
            });
          },
        });
      });
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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
