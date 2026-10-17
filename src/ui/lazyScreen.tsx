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
  let inflight: Promise<ComponentType<P>> | undefined;

  return function Lazy(props: P) {
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

      // One import even if the screen is opened and left several times while
      // it is still arriving.
      inflight ??= load();
      void inflight.then((component) => {
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
