import { RefObject, useCallback, useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref.
 * Calls `onIntersect` when the element enters the scroll container (root).
 * Pass the scroll container's RefObject as `rootRef` so intersection is
 * measured relative to the container — not the global viewport — which
 * prevents the observer from firing immediately on first render.
 */
export function useInfiniteScroll(
  onIntersect: () => void,
  enabled: boolean,
  rootRef?: RefObject<Element | null>,
): (node: HTMLElement | null) => void {
  const observer = useRef<IntersectionObserver | null>(null);

  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }

      if (!enabled || !node) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onIntersect();
          }
        },
        { root: rootRef?.current ?? null, threshold: 0.1 },
      );

      observer.current.observe(node);
    },
    [onIntersect, enabled, rootRef],
  );

  useEffect(() => {
    return () => {
      observer.current?.disconnect();
    };
  }, []);

  return refCallback;
}
