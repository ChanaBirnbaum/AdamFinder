import { RefObject } from 'react';
export declare function useInfiniteScroll(onIntersect: () => void, enabled: boolean, rootRef?: RefObject<Element | null>): (node: HTMLElement | null) => void;
