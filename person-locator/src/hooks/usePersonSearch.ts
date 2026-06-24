import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSinglePerson, searchPersons, DEFAULT_QUERY_SETTINGS } from '../services/elasticSearchService';
import { fetchAsirWhitelist, checkPersonPermission } from '../services/asirAuthService';
import type { AsirWhitelistResult, PersonPermissionResult } from '../services/asirAuthService';
import { fetchOnlinePersons } from '../services/onlineService';
import { searchOffline } from '../services/offlineService';
import { enrichPersonsWithPhotoUrls } from '../services/photoService';
import { mergeResults } from '../utils/mergeResults';
import { getConfig } from '../serviceConfig';
import { normalize, composeWithBase, compileToElasticQuery, compileToPredicate } from '../filters';
import type {
  PersonLocatorProps,
  PersonResult,
  PersonType,
  PagingState,
  SearchResults,
} from '../types';
import { useDebounce } from './useDebounce';
import { usePaging } from './usePaging';

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
    filters,
    baseFilter,
    additionalSearchFields = [],
    fallbackToOfflineIfNoAuth = false,
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

  // One filter tree, two compilers — base filter is always ANDed in and cannot be bypassed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filterTree = useMemo(
    () => normalize(composeWithBase(baseFilter, filters)),
    [JSON.stringify(baseFilter), JSON.stringify(filters)],
  );
  const filterClause = useMemo(() => compileToElasticQuery(filterTree), [filterTree]);
  const filterPredicate = useMemo(() => {
    const predicate = compileToPredicate(filterTree);
    if (env !== 'dev') return predicate;
    // Dev-only: log every evaluation so it's visible which filter ran and whether it matched.
    return (person: PersonResult) => {
      const result = predicate(person);
      // eslint-disable-next-line no-console
      console.log('[usePersonSearch] filterPredicate', { filter: filterTree, personId: person.id, result });
      return result;
    };
  }, [filterTree, env]);

  const [inputValue, setInputValueState] = useState('');
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);
  const [activeTab, setActiveTabState] = useState<PersonType>(singleType ?? 'asir');
  const [showActiveOnly, setShowActiveOnly] = useState(isDefaultActive ?? true);

  const { pagingState, advance, reset: resetPaging } = usePaging();

  // Always keep a ref in sync so runSearch can read the latest pagingState
  // without needing it in its useCallback dependency array.
  const pagingStateRef = useRef(pagingState);
  pagingStateRef.current = pagingState;

  const abortControllers = useRef<AbortController[]>([]);
  const justSelectedRef = useRef(false);
  /** Cached whitelist result (מידור) — specific prisoner IDs this user may see. Injected as ES filter. */
  const asirWhitelistRef = useRef<AsirWhitelistResult | null>(null);
  /** Cached permission result (הרשאת איתור) — array of per-type authorized IDs, [] = no access, null = unknown/fail-open. */
  const personPermissionRef = useRef<PersonPermissionResult[] | null>(null);
  /** Promise that resolves when the permission check completes. */
  const personPermissionPromiseRef = useRef<Promise<void> | null>(null);
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

  // Prisoner whitelist (מידור): fetch once on mount when asir is included and endpoint is configured
  useEffect(() => {
    const searchesAsirs = !typeArr || typeArr.includes('asir');
    if (!searchesAsirs || !config.asirWhitelist) return;
    const controller = new AbortController();
    fetchAsirWhitelist({ config, signal: controller.signal })
      .then((result) => { asirWhitelistRef.current = result; })
      .catch(() => { /* fail-open */ });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permission check (הרשאת איתור): fetch once on mount when fallbackToOfflineIfNoAuth is enabled
  useEffect(() => {
    if (!fallbackToOfflineIfNoAuth || !config.asirPermission) return;
    const controller = new AbortController();
    personPermissionPromiseRef.current = checkPersonPermission({ config, signal: controller.signal })
      .then((result) => { personPermissionRef.current = result; })
      .catch(() => { /* fail-open */ });
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

      // If fallbackToOfflineIfNoAuth is on, wait for the permission check to complete
      if (fallbackToOfflineIfNoAuth && personPermissionPromiseRef.current) {
        await personPermissionPromiseRef.current;
        personPermissionPromiseRef.current = null; // only await once
      }

      // No permission at all for a given type → use offline for that type (הרשאת איתור נדחתה)
      const noAccessTypes = new Set<PersonType>();
      if (fallbackToOfflineIfNoAuth && Array.isArray(personPermissionRef.current)) {
        for (const pt of types) {
          const hasAccess = personPermissionRef.current.some(r => r.type === pt && r.authorizedIds.length > 0);
          if (!hasAccess) noAccessTypes.add(pt);
        }
      }

      const baseOffset = isLoadMore && loadMoreTab
        ? pagingStateRef.current[loadMoreTab === 'asir' ? 'asirs' : loadMoreTab === 'soher' ? 'sohers' : 'ezrachs'].offset
        : 0;

      // Build ES promises per category
      const esPromises = (['asir', 'soher', 'ezrach'] as PersonType[]).map((pt, i) => {
        if (!types.includes(pt)) return Promise.resolve(null);
        if (isLoadMore && loadMoreTab !== pt) return Promise.resolve(null);
        // Skip ES for types the user has no access to → will use offline instead
        if (noAccessTypes.has(pt)) return Promise.resolve(null);
        return searchPersons({
          query,
          personType: pt,
          filterClause,
          offset: isLoadMore ? baseOffset : 0,
          pageSize,
          activeOnly: effectiveActiveOnly,
          config: pt === 'asir' && asirWhitelistRef.current
            ? {
                ...config,
                querySettings: {
                  ...config.querySettings,
                  asir: {
                    ...(config.querySettings?.asir ?? DEFAULT_QUERY_SETTINGS.asir),
                    allowedList: asirWhitelistRef.current,
                  },
                },
              }
            : config,
          signal: controllers[i].signal,
        });
      });

      // Online service promises — asirs and sohers only (no ezrachs)
      const onlinePrisonerPromise = !isLoadMore && types.includes('asir')
        ? fetchOnlinePersons({
            query,
            personType: 'asir',
            allowedAsirIds: asirWhitelistRef.current?.values,
            config: config,
            signal: controllers[3].signal,
          })
        : Promise.resolve([] as PersonResult[]);

      const onlineGuardPromise = !isLoadMore && types.includes('soher')
        ? fetchOnlinePersons({ query, personType: 'soher', config: config, signal: controllers[4].signal })
        : Promise.resolve([] as PersonResult[]);

      const [asirSettled, soherSettled, ezrachSettled, onlinePrisonerSettled, onlineGuardSettled] =
        await Promise.allSettled([...esPromises, onlinePrisonerPromise, onlineGuardPromise]);

      // Client-side filtering — mirrors the ES filter clause so all three sources agree.
      const rawOnlinePrisoners: PersonResult[] =
        onlinePrisonerSettled.status === 'fulfilled' ? (onlinePrisonerSettled.value as PersonResult[]) : [];
      const rawOnlineGuards: PersonResult[] =
        onlineGuardSettled.status === 'fulfilled' ? (onlineGuardSettled.value as PersonResult[]) : [];
      if (env === 'dev') {
        // TEMP DEBUG — remove once the online filtering issue is confirmed/fixed.
        console.log('[usePersonSearch] TEMP DEBUG raw online arrays before filterPredicate', {
          onlinePrisonerStatus: onlinePrisonerSettled.status,
          rawOnlinePrisonersCount: rawOnlinePrisoners.length,
          rawOnlinePrisoners,
          onlineGuardStatus: onlineGuardSettled.status,
          rawOnlineGuardsCount: rawOnlineGuards.length,
          rawOnlineGuards,
        });
      }
      const onlinePrisoners: PersonResult[] = rawOnlinePrisoners.filter(filterPredicate);
      const onlineGuards: PersonResult[] = rawOnlineGuards.filter(filterPredicate);

      const esByType: Record<PersonType, PromiseSettledResult<unknown>> = {
        asir: asirSettled, soher: soherSettled, ezrach: ezrachSettled,
      };

      // Each type independently needs offline data for its own reason:
      // no permission (noAccessTypes), or its own ES call failed (esFailedTypes).
      const esFailedTypes = new Set<PersonType>();
      for (const pt of types) {
        const settled = esByType[pt];
        if (settled.status === 'rejected' && !isAbortErrorLike(settled.reason)) {
          esFailedTypes.add(pt);
        }
      }
      const offlineNeededTypes = new Set<PersonType>([...noAccessTypes, ...esFailedTypes]);

      const offlineByType: Partial<Record<PersonType, PersonResult[]>> = {};
      if (offlineNeededTypes.size > 0 && !isLoadMore) {
        const offlineSettled = await Promise.allSettled(
          types
            .filter((pt) => offlineNeededTypes.has(pt))
            .map(async (pt) => {
              const offlineController = new AbortController();
              abortControllers.current.push(offlineController);
              const offlineResults = await searchOffline({
                query,
                personType: pt,
                config,
                signal: offlineController.signal,
              });
              if (env === 'dev') {
                // TEMP DEBUG — remove once the offline filtering issue is confirmed/fixed.
                console.log('[usePersonSearch] TEMP DEBUG raw offline results before filterPredicate', {
                  personType: pt,
                  rawOfflineResultsCount: offlineResults.length,
                  offlineResults,
                });
              }
              return { pt, offlineResults: offlineResults.filter(filterPredicate) };
            })
        );
        for (const settled of offlineSettled) {
          if (settled.status === 'fulfilled') {
            offlineByType[settled.value.pt] = settled.value.offlineResults;
          }
        }
      }

      // Banner only for a genuine ES outage — permission-based fallback is expected behaviour, not an outage.
      if (esFailedTypes.size > 0) setIsOffline(true);

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

      // Merge ES + online + offline per type (ezrachs: no online service)
      const asirMerged = mergeResults(mergeResults(asirES?.results ?? [], onlinePrisoners), offlineByType.asir ?? []);
      const soherMerged = mergeResults(mergeResults(soherES?.results ?? [], onlineGuards), offlineByType.soher ?? []);
      const ezrachMerged = mergeResults(ezrachES?.results ?? [], offlineByType.ezrach ?? []);
      const allMerged = [...asirMerged, ...soherMerged, ...ezrachMerged];
      // Offline results never get photos enriched/displayed — the offline DB has no photo data.
      const onlinePersons = allMerged.filter((p) => p.source !== 'offline');
      const offlinePersons = allMerged.filter((p) => p.source === 'offline');
      const enrichedOnline = await enrichPersonsWithPhotoUrls({
        persons: onlinePersons,
        config,
        signal: controllers[5].signal,
      });
      const enrichedAll = [...enrichedOnline, ...offlinePersons];

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
      }

      setIsLoading(false);
      setIsLoadingMore(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cancelPendingRequests, fallbackToOfflineIfNoAuth, filterClause, filterPredicate,
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

  // Re-run search when the filter changes (while query is active)
  useEffect(() => {
    if (debouncedInput.length >= minChars) {
      runSearch(debouncedInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClause, filterPredicate]);

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
