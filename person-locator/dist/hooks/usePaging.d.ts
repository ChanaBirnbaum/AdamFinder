import type { PagingState, PersonType } from '../types';
export interface UsePagingReturn {
    pagingState: PagingState;
    advance: (tab: PersonType, pageSize: number, hasMore: boolean) => void;
    setHasMore: (tab: PersonType, hasMore: boolean) => void;
    reset: () => void;
}
/**
 * Manages per-category pagination state.
 */
export declare function usePaging(): UsePagingReturn;
