import { RefObject, useCallback, useEffect, useRef } from 'react';

export function useInfiniteScroll(
  onIntersect: () => void,
  enabled: boolean,
  rootRef?: RefObject<Element | null>,
): (node: HTMLElement | null) => void {
  const isFiringRef = useRef(false);

  useEffect(() => {
    const container = rootRef?.current as HTMLElement | null;
    if (!enabled || !container) return;

    const isNearBottom = () =>
      container.scrollHeight - container.scrollTop - container.clientHeight < 80;

    const handleScroll = () => {
      if (isFiringRef.current) return;
      if (!isNearBottom()) return;

      isFiringRef.current = true;
      onIntersect();

      requestAnimationFrame(() => {
        isFiringRef.current = false;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, onIntersect, rootRef]);

  return useCallback(() => {}, []);
}