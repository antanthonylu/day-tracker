import { useEffect, useState } from 'preact/hooks';
import type { ComponentType, JSX } from 'preact';

export interface LazyComponent<P> {
  (props: P): JSX.Element;
  /** Fetches the chunk ahead of time, so opening the screen is instant. */
  preload: () => Promise<unknown>;
}

/**
 * Loads a screen's code the first time it is opened.
 *
 * Only the Log is needed to paint the app on launch, so the other screens are
 * fetched on demand -- but on demand means a blank frame the first time each
 * one is opened. `preload` lets the app fetch them once it is idle, which
 * keeps the small launch bundle and still makes every tab instant.
 */
export function lazyScreen<P>(load: () => Promise<ComponentType<P>>): LazyComponent<P> {
  let cached: ComponentType<P> | undefined;
  let inflight: Promise<ComponentType<P>> | undefined;

  const fetchOnce = () => {
    // One import even if the screen is opened and left several times while it
    // is still arriving.
    inflight ??= load().then((component) => {
      cached = component;
      return component;
    });
    return inflight;
  };

  const Lazy = (props: P) => {
    // Both of these wrap the component in an arrow on purpose. A function
    // handed to useState is treated as a lazy initialiser and *called*, and a
    // function handed to the setter is treated as an updater and *called* --
    // so passing the component bare stores whatever it returns when invoked
    // with no props, and the next render tries to use that as a component
    // type. It only bit on the second visit, once the cache was warm.
    const [Loaded, setLoaded] = useState<ComponentType<P> | undefined>(() => cached);

    useEffect(() => {
      if (Loaded) return;
      let alive = true;
      void fetchOnce().then((component) => {
        if (alive) setLoaded(() => component);
      });
      return () => {
        alive = false;
      };
    }, [Loaded]);

    if (!Loaded) return <div class="screen-loading" aria-busy="true" />;
    return <Loaded {...(props as P & JSX.IntrinsicAttributes)} />;
  };

  Lazy.preload = fetchOnce;
  return Lazy;
}

/**
 * Warms the given screens once the app has settled.
 *
 * Idle alone is not late enough: on a quick device the main thread frees up
 * before the first frame is even painted, so the idle callback fired early
 * and put ten chunks back in front of the paint the splitting existed to
 * protect. A delay first, idle second -- the fetch has to be invisible, and a
 * second or two later costs nothing a user can perceive.
 */
const PRELOAD_DELAY_MS = 1500;

export function preloadWhenIdle(screens: { preload: () => Promise<unknown> }[]): () => void {
  let cancelled = false;
  let idleHandle: number | undefined;

  const run = () => {
    if (cancelled) return;
    for (const screen of screens) void screen.preload();
  };

  const timer = setTimeout(() => {
    if (cancelled) return;
    const idle = window.requestIdleCallback;
    // Safari only gained requestIdleCallback recently; the delay alone is
    // already past the first frame, so running straight away is fine.
    if (typeof idle === 'function') idleHandle = idle(run, { timeout: 3000 });
    else run();
  }, PRELOAD_DELAY_MS);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    if (idleHandle !== undefined) window.cancelIdleCallback?.(idleHandle);
  };
}
