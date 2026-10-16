import { useEffect, useState } from 'preact/hooks';
import type { ComponentType, JSX } from 'preact';

/**
 * Loads a screen's code the first time it is opened.
 *
 * Only the Log is needed to paint the app on launch. Month, Year, Insights
 * and the sheets together are most of the bundle, and parsing them before the
 * first frame is time spent on screens that may never be opened. Each is
 * fetched on demand and then kept, so it costs once.
 */
export function lazyScreen<P>(load: () => Promise<ComponentType<P>>) {
  let cached: ComponentType<P> | undefined;

  return function Lazy(props: P) {
    const [Loaded, setLoaded] = useState<ComponentType<P> | undefined>(cached);

    useEffect(() => {
      if (Loaded) return;
      let alive = true;
      void load().then((component) => {
        cached = component;
        if (alive) setLoaded(() => component);
      });
      return () => {
        alive = false;
      };
    }, [Loaded]);

    if (!Loaded) return <div class="screen-loading" aria-busy="true" />;
    return <Loaded {...(props as P & JSX.IntrinsicAttributes)} />;
  };
}
