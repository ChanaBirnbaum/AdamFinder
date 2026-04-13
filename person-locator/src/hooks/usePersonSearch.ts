import { useCallback, useEffect, useRef, useState } from 'react';
import { OfflineError, fetchSinglePerson, searchPersons } from '../services/elasticSearchService';
import { fetchOnlinePersons } from '../services/onlineService';
import { searchOffline } from '../services/offlineService';
import { mergeResults } from '../utils/mergeResults';
import { getConfig } from '../serviceConfig';
import type {
  PersonLocatorProps,
  PersonResult,
  PersonType,
  PagingState,
  SearchResults,
} from '../types';
import { useDebounce } from './useDebounce';
import { usePaging } from './usePaging';

export interface UsePersonSearchReturn {
  results: SearchResults;
  isLoading: boolean;
  isLoadingMore: boolean;
  isOffline: boolean;
  error: string | null;
  selectedPerson: PersonResult | null;
  inputValue: string;
  activeTab: PersonType;
  pagingState: PagingState;
  setInputValue: (v: string) => void;
  setActiveTab: (tab: PersonType) => void;
  selectPerson: (person: PersonResult) => void;
  clearSelection: () => void;
  loadMore: (tab: PersonType) => void;
  showActiveOnly: boolean;
  setShowActiveOnly: (v: boolean) => void;
}

const emptyResults: SearchResults = {
  asirs: [],
  sohers: [],
  ezrachs: [],
  totalCount: 0,
};

function firstTabWithResults(results: SearchResults): PersonType {
  if (results.asirs.length > 0) return 'asir';
  if (results.sohers.length > 0) return 'soher';
  return 'ezrach';
}

export function usePersonSearch(props: PersonLocatorProps): UsePersonSearchReturn {
  const {
    type,
    minChars = 3,
    onSelect,
    filters = [],
    additionalSearchFields = [],
    additionalResultFields = [],
    enableOfflineSearch = false,
    singleSearch,
    state,
    clearData,
    activeOnly,
    isDefaultActive,
    env,
  } = props;

  const config = getConfig(env);
  const pageSize = config.pageSize ?? 3;

  const [inputValue, setInputValueState] = useState('');
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);
  const [activeTab, setActiveTabState] = useState<PersonType>(type ?? 'asir');
  const [showActiveOnly, setShowActiveOnly] = useState(isDefaultActive ?? false);

  const { pagingState, advance, setHasMore, reset: resetPaging } = usePaging();

  const abortControllers = useRef<AbortController[]>([]);
  const justSelectedRef = useRef(false);
  const debouncedInput = useDebounce(inputValue, 300);

  // Controlled state prop
  useEffect(() => {
    if (state !== undefined) {
      setSelectedPerson(state);
    }
  }, [state]);

  // singleSearch: fetch on mount
  useEffect(() => {
    if (!singleSearch) return;
    const controller = new AbortController();
    fetchSinglePerson({
      key: singleSearch.key,
      value: singleSearch.value,
      personType: type,
      config: config,
      signal: controller.signal,
    })
      .then((person) => {
        if (person) setSelectedPerson(person);
      })
      .catch(() => {/* silently ignore */});
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelPendingRequests = useCallback(() => {
    abortControllers.current.forEach((c) => c.abort());
    abortControllers.current = [];
  }, []);

  const effectiveActiveOnly =
    activeOnly !== undefined ? activeOnly : showActiveOnly;

  const runSearch = useCallback(
    async (query: string, isLoadMore = false, loadMoreTab?: PersonType) => {
      cancelPendingRequests();

      const controllers = [
        new AbortController(), // 0: ES asirs
        new AbortController(), // 1: ES sohers
        new AbortController(), // 2: ES ezrachs
        new AbortController(), // 3: online asirs
        new AbortController(), // 4: online sohers
      ];
      abortControllers.current = controllers;

      if (!isLoadMore) {
        setIsLoading(true);
        setError(null);
        setIsOffline(false);
        resetPaging();
      } else {
        setIsLoadingMore(true);
      }

      const types: PersonType[] = type
        ? [type]
        : ['asir', 'soher', 'ezrach'];

      const baseOffset = isLoadMore && loadMoreTab
        ? pagingState[loadMoreTab === 'asir' ? 'asirs' : loadMoreTab === 'soher' ? 'sohers' : 'ezrachs'].offset
        : 0;

      // Build ES promises per category
      const esPromises = (['asir', 'soher', 'ezrach'] as PersonType[]).map((pt, i) => {
        if (!types.includes(pt)) {
          return Promise.resolve(null);
        }
        if (isLoadMore && loadMoreTab !== pt) {
          return Promise.resolve(null);
        }
        return searchPersons({
          query,
          personType: pt,
          filters,
          additionalSearchFields,
          offset: isLoadMore ? baseOffset : 0,
          pageSize,
          activeOnly: effectiveActiveOnly,
          config: config,
          signal: controllers[i].signal,
        });
      });

      // Online service promises — asirs and sohers only (no ezrachs)
      const onlinePrisonerPromise = !isLoadMore && types.includes('asir')
        ? fetchOnlinePersons({ query, personType: 'asir', config: config, signal: controllers[3].signal })
        : Promise.resolve([] as PersonResult[]);

      const onlineGuardPromise = !isLoadMore && types.includes('soher')
        ? fetchOnlinePersons({ query, personType: 'soher', config: config, signal: controllers[4].signal })
        : Promise.resolve([] as PersonResult[]);

      const [asirSettled, soherSettled, ezrachSettled, onlinePrisonerSettled, onlineGuardSettled] =
        await Promise.allSettled([...esPromises, onlinePrisonerPromise, onlineGuardPromise]);

      const onlinePrisoners: PersonResult[] =
        onlinePrisonerSettled.status === 'fulfilled' ? (onlinePrisonerSettled.value as PersonResult[]) : [];
      const onlineGuards: PersonResult[] =
        onlineGuardSettled.status === 'fulfilled' ? (onlineGuardSettled.value as PersonResult[]) : [];

      // Check if all ES calls failed with OfflineError
      const esSettled = [asirSettled, soherSettled, ezrachSettled];
      const allOffline = esSettled
        .filter((_, i) => types.includes((['asir', 'soher', 'ezrach'] as PersonType[])[i]))
        .every(
          (s) => s.status === 'rejected' && s.reason instanceof OfflineError
        );

      if (allOffline && enableOfflineSearch) {
        setIsOffline(true);
        try {
          const offlineController = new AbortController();
          abortControllers.current.push(offlineController);
          const offlineResults = await searchOffline({
            query,
            personType: type,
            config: config,
            signal: offlineController.signal,
          });

          const grouped = groupByType(offlineResults);
          setResults({
            ...grouped,
            totalCount: offlineResults.length,
          });
        } catch {
          setError('חיפוש לא מקוון נכשל');
        }
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Extract ES results per type
      const getESResult = (
        settled: PromiseSettledResult<unknown>
      ): { results: PersonResult[]; hasMore: boolean } | null => {
        if (settled.status === 'fulfilled' && settled.value !== null) {
          return settled.value as { results: PersonResult[]; hasMore: boolean };
        }
        return null;
      };

      const asirES = getESResult(asirSettled);
      const soherES = getESResult(soherSettled);
      const ezrachES = getESResult(ezrachSettled);

      // Merge ES + online per type (ezrachs: ES only)
      const asirMerged = mergeResults(asirES?.results ?? [], onlinePrisoners);
      const soherMerged = mergeResults(soherES?.results ?? [], onlineGuards);
      const ezrachMerged = ezrachES?.results ?? [];

      if (isLoadMore && loadMoreTab) {
        setResults((prev) => {
          const key = loadMoreTab === 'asir' ? 'asirs'
            : loadMoreTab === 'soher' ? 'sohers' : 'ezrachs';
          const newArr = loadMoreTab === 'asir' ? asirMerged
            : loadMoreTab === 'soher' ? soherMerged : ezrachMerged;
          const merged = [...prev[key], ...newArr];
          const total = merged.length +
            (loadMoreTab === 'asir' ? prev.sohers.length + prev.ezrachs.length :
             loadMoreTab === 'soher' ? prev.asirs.length + prev.ezrachs.length :
             prev.asirs.length + prev.sohers.length);
          return { ...prev, [key]: merged, totalCount: total };
        });

        const hasMore = loadMoreTab === 'asir' ? (asirES?.hasMore ?? false)
          : loadMoreTab === 'soher' ? (soherES?.hasMore ?? false)
          : (ezrachES?.hasMore ?? false);
        advance(loadMoreTab, pageSize, hasMore);
      } else {
        const newResults: SearchResults = {
          asirs: asirMerged,
          sohers: soherMerged,
          ezrachs: ezrachMerged,
          totalCount: asirMerged.length + soherMerged.length + ezrachMerged.length,
        };
        setResults(newResults);

        // Update hasMore per category
        if (asirES) setHasMore('asir', asirES.hasMore);
        if (soherES) setHasMore('soher', soherES.hasMore);
        if (ezrachES) setHasMore('ezrach', ezrachES.hasMore);

        // Set active tab to first category with results
        setActiveTabState(firstTabWithResults(newResults));

        // Handle general errors if any ES call failed with non-OfflineError
        const anyError = esSettled.find(
          (s) => s.status === 'rejected' && !(s.reason instanceof OfflineError)
        );
        if (anyError && anyError.status === 'rejected') {
          setError(`שגיאת חיפוש: ${anyError.reason?.message ?? 'שגיאה לא ידועה'}`);
        }
      }

      setIsLoading(false);
      setIsLoadingMore(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cancelPendingRequests, enableOfflineSearch, filters, additionalSearchFields,
      additionalResultFields, pageSize, config, type, effectiveActiveOnly,
    ]
  );

  // Fire search when debounced input changes
  useEffect(() => {
    if (debouncedInput.length < minChars) return;
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    runSearch(debouncedInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, minChars]);

  // Re-run search when type filter changes (while query is active)
  useEffect(() => {
    if (debouncedInput.length >= minChars) {
      runSearch(debouncedInput);
    } else {
      setResults(emptyResults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Re-run search when active toggle changes (while query is active)
  useEffect(() => {
    if (debouncedInput.length >= minChars) {
      runSearch(debouncedInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showActiveOnly]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelPendingRequests();
  }, [cancelPendingRequests]);

  const setInputValue = useCallback((v: string) => {
    setInputValueState(v);
    setSelectedPerson(null);
    if (v.length < minChars) {
      setResults(emptyResults);
      setError(null);
      setIsOffline(false);
    }
  }, [minChars]);

  const setActiveTab = useCallback((tab: PersonType) => {
    setActiveTabState(tab);
  }, []);

  const selectPerson = useCallback(
    (person: PersonResult) => {
      justSelectedRef.current = true;
      setSelectedPerson(person);
      setInputValueState(String(person.data['fullName'] ?? ''));
      onSelect?.(person);
    },
    [onSelect]
  );

  const clearSelection = useCallback(() => {
    setInputValueState('');
    setResults(emptyResults);
    setSelectedPerson(null);
    setError(null);
    setIsOffline(false);
    resetPaging();
    clearData?.();
  }, [clearData, resetPaging]);

  const loadMore = useCallback(
    (tab: PersonType) => {
      if (debouncedInput.length < minChars) return;
      const key = tab === 'asir' ? 'asirs' : tab === 'soher' ? 'sohers' : 'ezrachs';
      if (!pagingState[key].hasMore || isLoadingMore) return;
      runSearch(debouncedInput, true, tab);
    },
    [debouncedInput, minChars, pagingState, isLoadingMore, runSearch]
  );

  return {
    results,
    isLoading,
    isLoadingMore,
    isOffline,
    error,
    selectedPerson,
    inputValue,
    activeTab,
    pagingState,
    setInputValue,
    setActiveTab,
    selectPerson,
    clearSelection,
    loadMore,
    showActiveOnly,
    setShowActiveOnly,
  };
}

function groupByType(persons: PersonResult[]): Omit<SearchResults, 'totalCount'> {
  return {
    asirs: persons.filter((p) => p.personType === 'asir'),
    sohers: persons.filter((p) => p.personType === 'soher'),
    ezrachs: persons.filter((p) => p.personType === 'ezrach'),
  };
}
