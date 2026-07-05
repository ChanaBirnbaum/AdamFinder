import { type CSSProperties, type RefObject } from 'react';
/**
 * Computes fixed-position coordinates that pin an element directly under (or over)
 * an anchor element, recalculating on scroll (capture phase, so nested scroll
 * containers are caught too) and resize. Meant for panels portaled to <body> to
 * escape clipping ancestors (e.g. overflow:hidden), which lose the normal
 * relative-parent positioning they'd otherwise rely on.
 */
export declare function useAnchoredPosition(anchorRef: RefObject<HTMLElement | null>, direction: 'up' | 'down'): CSSProperties;
