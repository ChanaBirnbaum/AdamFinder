import { useCallback, useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref.
 * Calls `onIntersect` when the element enters the viewport.
 */
export function useInfiniteScroll(
  onIntersect: () => void,
  enabled: boolean
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
        { threshold: 0.1 }
      );

      observer.current.observe(node);
    },
    [onIntersect, enabled]
  );

  useEffect(() => {
    return () => {
      observer.current?.disconnect();
    };
  }, []);

  return refCallback;
}
