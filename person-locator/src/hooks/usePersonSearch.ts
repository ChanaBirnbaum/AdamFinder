import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSinglePerson, searchPersons, DEFAULT_QUERY_SETTINGS } from '../services/elasticSearchService';
import { OfflineError } from '../services/axiosInstance';
import { fetchOnlinePersons } from '../services/onlineService';
import { searchOffline } from '../services/offlineService';
import { enrichPersonsWithPhotoUrls } from '../services/photoService';
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

function isOfflineErrorLike(error: unknown): boolean {
  if (error == null) return true;
  if (error instanceof OfflineError) return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'OfflineError'
  );
}

function isAbortErrorLike(error: unknown): boolean {
  if (error == null) return false;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

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
  /** Fields to display in the expanded card section — sourced from config.querySettings[activeTab].sourceFields */
  displayFields: string[];
}

const emptyResults: SearchResults = {
  asirs: [],
  sohers: [],
  ezrachs: [],
  totalsByType: { asir: 0, soher: 0, ezrach: 0 },
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
    enableOfflineSearch = false,
    singleSearch,
    state,
    clearData,
    activeOnly,
    isDefaultActive,
    env,
    serviceConfig: serviceConfigOverride,
  } = props;

  const config = { ...getConfig(env), ...serviceConfigOverride };
  const pageSize = config.pageSize ?? 3;

  // Normalize type → always a sorted array (or undefined = all)
  const typeArr: PersonType[] | undefined = type
    ? (Array.isArray(type) ? type : [type])
    : undefined;
  // Single locked type (for singleSearch, offline, tab locking)
  const singleType: PersonType | undefined = typeArr?.length === 1 ? typeArr[0] : undefined;

  const [inputValue, setInputValueState] = useState('');
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);
  const [activeTab, setActiveTabState] = useState<PersonType>(singleType ?? 'asir');
  const [showActiveOnly, setShowActiveOnly] = useState(isDefaultActive ?? false);

  const { pagingState, advance, reset: resetPaging } = usePaging();

  // Always keep a ref in sync so runSearch can read the latest pagingState
  // without needing it in its useCallback dependency array.
  const pagingStateRef = useRef(pagingState);
  pagingStateRef.current = pagingState;

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
      personType: singleType,
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
        new AbortController(), // 5: photos enrichment
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

      const types: PersonType[] = typeArr ?? ['asir', 'soher', 'ezrach'];

      const baseOffset = isLoadMore && loadMoreTab
        ? pagingStateRef.current[loadMoreTab === 'asir' ? 'asirs' : loadMoreTab === 'soher' ? 'sohers' : 'ezrachs'].offset
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
      const relevantEsSettled = esSettled
        .filter((_, i) => types.includes((['asir', 'soher', 'ezrach'] as PersonType[])[i]));
      const allRejected = relevantEsSettled.every((s) => s.status === 'rejected');
      const allOffline = relevantEsSettled.every(
        (s) => s.status === 'rejected' && isOfflineErrorLike(s.reason)
      );

      if ((allOffline || allRejected) && enableOfflineSearch) {
        setIsOffline(true);
        try {
          const offlineController = new AbortController();
          abortControllers.current.push(offlineController);
          const offlineResults = await searchOffline({
            query,
            personType: singleType,
            config: config,
            signal: offlineController.signal,
          });

          const grouped = groupByType(offlineResults);
          const totalsByType = {
            asir: grouped.asirs.length,
            soher: grouped.sohers.length,
            ezrach: grouped.ezrachs.length,
          };
          setResults({
            ...grouped,
            totalsByType,
            totalCount: totalsByType.asir + totalsByType.soher + totalsByType.ezrach,
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
      ): { results: PersonResult[]; hasMore: boolean; total: number } | null => {
        if (settled.status === 'fulfilled' && settled.value !== null) {
          return settled.value as { results: PersonResult[]; hasMore: boolean; total: number };
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
      const allMerged = [...asirMerged, ...soherMerged, ...ezrachMerged];
      const enrichedAll = await enrichPersonsWithPhotoUrls({
        persons: allMerged,
        config,
        signal: controllers[5].signal,
      });

      const asirEnriched = enrichedAll.filter((p) => p.personType === 'asir');
      const soherEnriched = enrichedAll.filter((p) => p.personType === 'soher');
      const ezrachEnriched = enrichedAll.filter((p) => p.personType === 'ezrach');

      if (isLoadMore && loadMoreTab) {
        setResults((prev) => {
          const key = loadMoreTab === 'asir' ? 'asirs'
            : loadMoreTab === 'soher' ? 'sohers' : 'ezrachs';
          const newArr = loadMoreTab === 'asir' ? asirEnriched
            : loadMoreTab === 'soher' ? soherEnriched : ezrachEnriched;
          const merged = [...prev[key], ...newArr];
          const tabTotal = loadMoreTab === 'asir' ? (asirES?.total ?? prev.totalsByType.asir)
            : loadMoreTab === 'soher' ? (soherES?.total ?? prev.totalsByType.soher)
            : (ezrachES?.total ?? prev.totalsByType.ezrach);
          const totalsByType = {
            ...prev.totalsByType,
            [loadMoreTab]: tabTotal,
          };
          const totalCount = totalsByType.asir + totalsByType.soher + totalsByType.ezrach;
          return { ...prev, [key]: merged, totalsByType, totalCount };
        });

        const hasMore = loadMoreTab === 'asir' ? (asirES?.hasMore ?? false)
          : loadMoreTab === 'soher' ? (soherES?.hasMore ?? false)
          : (ezrachES?.hasMore ?? false);
        advance(loadMoreTab, pageSize, hasMore);
      } else {
        const totalsByType = {
          asir: asirES?.total ?? asirEnriched.length,
          soher: soherES?.total ?? soherEnriched.length,
          ezrach: ezrachES?.total ?? ezrachEnriched.length,
        };
        const newResults: SearchResults = {
          asirs: asirEnriched,
          sohers: soherEnriched,
          ezrachs: ezrachEnriched,
          totalsByType,
          totalCount: totalsByType.asir + totalsByType.soher + totalsByType.ezrach,
        };
        setResults(newResults);

        // Advance offset and update hasMore per category so the first
        // load-more request uses offset=pageSize instead of 0.
        if (asirES) advance('asir', pageSize, asirES.hasMore);
        if (soherES) advance('soher', pageSize, soherES.hasMore);
        if (ezrachES) advance('ezrach', pageSize, ezrachES.hasMore);

        // Set active tab to first category with results
        setActiveTabState(firstTabWithResults(newResults));

        // Handle general errors if any ES call failed with non-OfflineError
        const anyError = esSettled.find(
          (s) =>
            s.status === 'rejected' &&
            !isOfflineErrorLike(s.reason) &&
            !isAbortErrorLike(s.reason)
        );
        if (anyError && anyError.status === 'rejected') {
          if (newResults.totalCount === 0) {
            setError('לא הצלחנו להשלים את החיפוש כרגע. אפשר לנסות שוב.');
          }
        }
      }

      setIsLoading(false);
      setIsLoadingMore(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cancelPendingRequests, enableOfflineSearch, filters,
      pageSize, config, typeArr, effectiveActiveOnly,
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
  }, [JSON.stringify(typeArr)]);

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
    displayFields: (config.querySettings?.[activeTab] ?? DEFAULT_QUERY_SETTINGS[activeTab]).sourceFields,
  };
}

function groupByType(persons: PersonResult[]): Omit<SearchResults, 'totalCount' | 'totalsByType'> {
  return {
    asirs: persons.filter((p) => p.personType === 'asir'),
    sohers: persons.filter((p) => p.personType === 'soher'),
    ezrachs: persons.filter((p) => p.personType === 'ezrach'),
  };
}
