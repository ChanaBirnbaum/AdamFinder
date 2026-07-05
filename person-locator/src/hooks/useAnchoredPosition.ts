import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Computes fixed-position coordinates that pin an element directly under (or over)
 * an anchor element, recalculating on scroll (capture phase, so nested scroll
 * containers are caught too) and resize. Meant for panels portaled to <body> to
 * escape clipping ancestors (e.g. overflow:hidden), which lose the normal
 * relative-parent positioning they'd otherwise rely on.
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  direction: 'up' | 'down',
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', visibility: 'hidden' });

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      setStyle(
        direction === 'up'
          ? { position: 'fixed', left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top }
          : { position: 'fixed', left: rect.left, width: rect.width, top: rect.bottom },
      );
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorRef, direction]);

  return style;
}
