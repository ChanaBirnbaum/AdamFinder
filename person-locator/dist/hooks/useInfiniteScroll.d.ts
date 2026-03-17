/**
 * Attaches an IntersectionObserver to the returned ref.
 * Calls `onIntersect` when the element enters the viewport.
 */
export declare function useInfiniteScroll(onIntersect: () => void, enabled: boolean): (node: HTMLElement | null) => void;
