import { useCallback, useState } from 'react';
import type { PagingState, PersonType } from '../types';

const initialState: PagingState = {
  asirs: { offset: 0, hasMore: false },
  sohers: { offset: 0, hasMore: false },
  ezrachs: { offset: 0, hasMore: false },
};

const KEY_MAP: Record<PersonType, keyof PagingState> = {
  asir: 'asirs',
  soher: 'sohers',
  ezrach: 'ezrachs',
};

export interface UsePagingReturn {
  pagingState: PagingState;
  advance: (tab: PersonType, pageSize: number, hasMore: boolean) => void;
  setHasMore: (tab: PersonType, hasMore: boolean) => void;
  reset: () => void;
}

/**
 * Manages per-category pagination state.
 */
export function usePaging(): UsePagingReturn {
  const [pagingState, setPagingState] = useState<PagingState>(initialState);

  const advance = useCallback((tab: PersonType, pageSize: number, hasMore: boolean) => {
    const key = KEY_MAP[tab];
    setPagingState((prev) => ({
      ...prev,
      [key]: {
        offset: prev[key].offset + pageSize,
        hasMore,
      },
    }));
  }, []);

  const setHasMore = useCallback((tab: PersonType, hasMore: boolean) => {
    const key = KEY_MAP[tab];
    setPagingState((prev) => ({
      ...prev,
      [key]: { ...prev[key], hasMore },
    }));
  }, []);

  const reset = useCallback(() => {
    setPagingState(initialState);
  }, []);

  return { pagingState, advance, setHasMore, reset };
}
