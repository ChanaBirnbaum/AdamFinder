import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSinglePerson, searchPersons, DEFAULT_QUERY_SETTINGS } from '../services/elasticSearchService';
import { fetchAsirWhitelist, checkPersonPermission } from '../services/asirAuthService';
import type { AsirWhitelistResult, PersonPermissionResult } from '../services/asirAuthService';
import { fetchFieldConfig } from '../services/fieldConfigService';
import type { FieldConfigResponse } from '../services/fieldConfigService';
import { fetchOnlinePersons } from '../services/onlineService';
import { searchOffline } from '../services/offlineService';
import { enrichPersonsWithPhotoUrls } from '../services/photoService';
import { mergeResults } from '../utils/mergeResults';
import { DESCRIPTION_FIELD } from '../utils/descriptionFields';
import { normalizeQuery } from '../utils/normalizeQuery';
import { getConfig } from '../serviceConfig';
import { normalize, composeWithBase, compileToElasticQuery, compileToPredicate } from '../filters';
import type {
  PersonLocatorProps,
  PersonResult,
  PersonType,
  PagingState,
  SearchResults,
  ServiceConfig,
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

/**
 * Builds the effective ES config by applying three layers in order:
 * 1. whitelist  → injects `allowedList` into asir settings (מידור)
 * 2. remoteFields → overrides searchFields/sourceFields per type from the server
 * 3. extra      → merges caller's additionalSourceFields on top
 */
function buildEsConfig(
  base: ServiceConfig,
  whitelist: AsirWhitelistResult | null,
  remoteFields: FieldConfigResponse | null,
  extra: Partial<Record<PersonType, string[]>> | undefined,
): ServiceConfig {
  let config = base;

  if (whitelist) {
    config = {
      ...config,
      querySettings: {
        ...config.querySettings,
        asir: {
          ...(config.querySettings?.asir ?? DEFAULT_QUERY_SETTINGS.asir),
          allowedList: whitelist,
        },
      },
    };
  }

  if (remoteFields) {
    const qs = { ...config.querySettings };
    for (const pt of Object.keys(remoteFields) as PersonType[]) {
      const fields = remoteFields[pt];
      if (!fields) continue;
      qs[pt] = { ...(qs[pt] ?? DEFAULT_QUERY_SETTINGS[pt]), searchFields: fields.searchFields, sourceFields: fields.sourceFields };
    }
    config = { ...config, querySettings: qs };
  }

  if (extra) {
    const qs = { ...config.querySettings };
    for (const pt of Object.keys(extra) as PersonType[]) {
      const extraFields = extra[pt];
      if (!extraFields?.length) continue;
      const curr = qs[pt] ?? DEFAULT_QUERY_SETTINGS[pt];
      qs[pt] = { ...curr, sourceFields: [...new Set([...curr.sourceFields, ...extraFields])] };
    }
    config = { ...config, querySettings: qs };
  }

  return config;
}

/**
 * Whether the user has permission (הרשאת איתור) to search the given type.
 * `personType` omitted (singleSearch across all types) → lenient: access if ANY type is authorized.
 * `permissions` not an array (not configured / check failed) → fail-open: true.
 */
function hasPersonTypeAccess(
  permissions: PersonPermissionResult[] | null,
  personType?: PersonType,
): boolean {
  if (!Array.isArray(permissions)) return true;
  return permissions.some(
    (r) => (!personType || r.type === personType) && r.authorizedIds.length > 0,
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
  selectPerson: (person: PersonResult, options?: { refreshPhoto?: boolean }) => void;
  clearSelection: () => void;
  loadMore: (tab: PersonType) => void;
  showActiveOnly: boolean;
  setShowActiveOnly: (v: boolean) => void;
  /** Fields to display in the expanded card section — sourced from config.querySettings[activeTab].sourceFields */
  displayFields: string[];
}

/**
 * Flat keys lifted out of the soher description blob at map time (see
 * `parseDescriptionEntries`) — shown in the expanded card when `soherExpandedView` is on.
 */
const SOHER_EXPANDED_DISPLAY_FIELDS = ['סטטוס', 'אזור'];

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
    additionalSourceFields,
    soherExpandedView = false,
    fallbackToOfflineIfNoAuth = false,
    singleSearch,
    state,
    onClear,
    activeOnly,
    isDefaultActive,
    env,
    serviceConfig: serviceConfigOverride,
  } = props;

  const config = { ...getConfig(env), ...serviceConfigOverride };
  const pageSize = config.pageSize ?? 3;

  // soherExpandedView fetches the raw description blob from ES; its parsed keys
  // (SOHER_EXPANDED_DISPLAY_FIELDS) are what actually get displayed — see displayFields below.
  // buildEsConfig dedupes, so overlap with caller-provided soher fields is harmless.
  const effectiveSourceFields = soherExpandedView
    ? {
        ...additionalSourceFields,
        soher: [...(additionalSourceFields?.soher ?? []), DESCRIPTION_FIELD],
      }
    : additionalSourceFields;

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
  /** Mirrors remoteFieldConfigRef as state — displayFields is computed at render time and needs to react once the fetch resolves. */
  const [remoteFieldConfig, setRemoteFieldConfig] = useState<FieldConfigResponse | null>(null);

  const { pagingState, advance, reset: resetPaging } = usePaging();

  // Always keep a ref in sync so runSearch can read the latest pagingState
  // without needing it in its useCallback dependency array.
  const pagingStateRef = useRef(pagingState);
  pagingStateRef.current = pagingState;

  const abortControllers = useRef<AbortController[]>([]);
  /**
   * Monotonic id of the most recently started search. Aborting the in-flight requests is not
   * enough on its own: Promise.allSettled swallows the AbortError, and a run whose requests had
   * already resolved cannot be cancelled at all — either way the superseded run would keep going
   * and write its (older, broader) results over the newer ones. Every run captures its id and
   * bails after each await once a newer run has started.
   */
  const runIdRef = useRef(0);
  const justSelectedRef = useRef(false);
  /** Aborts the in-flight photo refresh (see selectPerson) when a new person is selected before it resolves. */
  const selectedPhotoAbortRef = useRef<AbortController | null>(null);
  /** Online-only additions (people merged in from the online service but absent from the ES page) per type — online is only fetched on a fresh search, so load-more must reuse this. */
  const onlineExtraByTypeRef = useRef<Record<PersonType, number>>({ asir: 0, soher: 0, ezrach: 0 });
  /** Cached whitelist result (מידור) — specific prisoner IDs this user may see. Injected as ES filter. */
  const asirWhitelistRef = useRef<AsirWhitelistResult | null>(null);
  /** Promise that resolves when the whitelist fetch completes — awaited by singleSearch so it never races the mount-time fetch. */
  const asirWhitelistPromiseRef = useRef<Promise<void> | null>(null);
  /** Cached permission result (הרשאת איתור) — array of per-type authorized IDs, [] = no access, null = unknown/fail-open. */
  const personPermissionRef = useRef<PersonPermissionResult[] | null>(null);
  /** Promise that resolves when the permission check completes. */
  const personPermissionPromiseRef = useRef<Promise<void> | null>(null);
  /** Cached remote field config — per-type searchFields/sourceFields from the server, overriding DEFAULT_QUERY_SETTINGS. */
  const remoteFieldConfigRef = useRef<FieldConfigResponse | null>(null);
  /** Promise that resolves when the remote field config fetch completes — awaited before every ES call so fields are never stale on the very first search. */
  const remoteFieldConfigPromiseRef = useRef<Promise<void> | null>(null);
  const debouncedInput = useDebounce(inputValue, 300);

  // Controlled state prop
  useEffect(() => {
    if (state !== undefined) {
      setSelectedPerson(state);
    }
  }, [state]);

  // Prisoner whitelist (מידור): fetch once on mount when asir is included and endpoint is configured
  useEffect(() => {
    const searchesAsirs = !typeArr || typeArr.includes('asir');
    if (!searchesAsirs || !config.asirWhitelist) return;
    const controller = new AbortController();
    asirWhitelistPromiseRef.current = fetchAsirWhitelist({ config, signal: controller.signal })
      .then((result) => { asirWhitelistRef.current = result; })
      .catch(() => { /* fail-open */ });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remote field config: fetch once on mount when configured — per-type searchFields/sourceFields
  // from the server, overriding DEFAULT_QUERY_SETTINGS so data owners can change them without a client deploy.
  useEffect(() => {
    if (!config.fieldConfig) return;
    const controller = new AbortController();
    remoteFieldConfigPromiseRef.current = fetchFieldConfig({ config, signal: controller.signal })
      .then((result) => {
        remoteFieldConfigRef.current = result;
        setRemoteFieldConfig(result);
      })
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

  // singleSearch: fetch on mount — tries ES + online in parallel; if neither finds a match
  // (including when the user has no ES permission for this type) and fallbackToOfflineIfNoAuth
  // is set, also tries the offline service. Must run after the whitelist/permission-check effects
  // above so their promise refs are already populated by the time this awaits them.
  useEffect(() => {
    if (!singleSearch) return;
    const esController = new AbortController();
    const onlineController = new AbortController();
    const offlineController = new AbortController();

    (async () => {
      if (asirWhitelistPromiseRef.current) {
        await asirWhitelistPromiseRef.current;
      }

      if (remoteFieldConfigPromiseRef.current) {
        await remoteFieldConfigPromiseRef.current;
      }

      if (fallbackToOfflineIfNoAuth && personPermissionPromiseRef.current) {
        await personPermissionPromiseRef.current;
        personPermissionPromiseRef.current = null;
      }

      const hasAccess = !fallbackToOfflineIfNoAuth || hasPersonTypeAccess(personPermissionRef.current, singleType);

      const esConfig = buildEsConfig(config, asirWhitelistRef.current, remoteFieldConfigRef.current, effectiveSourceFields);

      const esPromise = hasAccess
        ? fetchSinglePerson({
            key: singleSearch.key,
            value: singleSearch.value,
            personType: singleType,
            config: esConfig,
            signal: esController.signal,
          }).catch(() => null)
        : Promise.resolve(null);

      const onlinePromise = singleType !== 'ezrach'
        ? fetchOnlinePersons({
            query: singleSearch.value,
            personType: singleType,
            allowedAsirIds: asirWhitelistRef.current?.values,
            config: config,
            signal: onlineController.signal,
          }).catch(() => [] as PersonResult[])
        : Promise.resolve([] as PersonResult[]);

      const [esPerson, onlinePersons] = await Promise.all([esPromise, onlinePromise]);
      // filterPredicate mirrors baseFilter/filters — must apply here too, same as it does for
      // runSearch's online/offline results, so a single-search lookup can't bypass them.
      const esPersonFiltered = esPerson && filterPredicate(esPerson) ? esPerson : null;
      const onlinePersonsFiltered = onlinePersons.filter(filterPredicate);
      const found = onlinePersonsFiltered[0] ?? esPersonFiltered ?? null;
      if (found) {
        setSelectedPerson(found);
        return;
      }

      if (fallbackToOfflineIfNoAuth) {
        const offlinePersons = await searchOffline({
          query: singleSearch.value,
          personType: singleType,
          config: config,
          signal: offlineController.signal,
        }).catch(() => [] as PersonResult[]);
        const offlinePersonsFiltered = offlinePersons.filter(filterPredicate);
        if (offlinePersonsFiltered[0]) setSelectedPerson(offlinePersonsFiltered[0]);
      }
    })().catch(() => {/* silently ignore */});

    return () => {
      esController.abort();
      onlineController.abort();
      offlineController.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelPendingRequests = useCallback(() => {
    abortControllers.current.forEach((c) => c.abort());
    abortControllers.current = [];
    // Retire the in-flight run as well: aborting only stops requests that are still open, while
    // the run-id bump also stops one that is mid-flight between its awaits.
    runIdRef.current++;
  }, []);

  const effectiveActiveOnly =
    activeOnly !== undefined ? activeOnly : showActiveOnly;

  const runSearch = useCallback(
    async (rawQuery: string, isLoadMore = false, loadMoreTab?: PersonType) => {
      // Normalize once, here, before the query fans out to ES/online/offline — every source
      // must agree on what was searched for, and the conversion logic must not be duplicated
      // per source (e.g. inside the ES query builder).
      const query = normalizeQuery(rawQuery);
      cancelPendingRequests();

      const runId = ++runIdRef.current;
      /** True once a newer search has started — this run must not touch any state. */
      const isStale = () => runIdRef.current !== runId;

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
        // A fresh search supersedes any in-flight load-more, which now bails before clearing this.
        setIsLoadingMore(false);
        setError(null);
        setIsOffline(false);
        resetPaging();
      } else {
        setIsLoadingMore(true);
      }

      const types: PersonType[] = typeArr ?? ['asir', 'soher', 'ezrach'];

      // Wait for the remote field config fetch so the very first search already uses it, not the
      // hardcoded DEFAULT_QUERY_SETTINGS fields.
      if (remoteFieldConfigPromiseRef.current) {
        await remoteFieldConfigPromiseRef.current;
        if (isStale()) return;
      }

      // If fallbackToOfflineIfNoAuth is on, wait for the permission check to complete
      if (fallbackToOfflineIfNoAuth && personPermissionPromiseRef.current) {
        await personPermissionPromiseRef.current;
        personPermissionPromiseRef.current = null; // only await once
        if (isStale()) return;
      }

      // No permission at all for a given type → use offline for that type (הרשאת איתור נדחתה)
      const noAccessTypes = new Set<PersonType>();
      if (fallbackToOfflineIfNoAuth) {
        for (const pt of types) {
          if (!hasPersonTypeAccess(personPermissionRef.current, pt)) noAccessTypes.add(pt);
        }
      }

      const baseOffset = isLoadMore && loadMoreTab
        ? pagingStateRef.current[loadMoreTab === 'asir' ? 'asirs' : loadMoreTab === 'soher' ? 'sohers' : 'ezrachs'].offset
        : 0;

      // Whitelist only ever touches querySettings.asir, and remote fields are merged per type —
      // safe to compute once and reuse for every type's ES call.
      const esConfig = buildEsConfig(config, asirWhitelistRef.current, remoteFieldConfigRef.current, effectiveSourceFields);

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
          config: esConfig,
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

      if (isStale()) return;

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
              // Push onto this run's own array — abortControllers.current may already have been
              // replaced by a newer run, which would leave this request uncancellable.
              controllers.push(offlineController);
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
        if (isStale()) return;
        for (const settled of offlineSettled) {
          if (settled.status === 'fulfilled') {
            offlineByType[settled.value.pt] = settled.value.offlineResults;
          }
        }
      }

      // Banner only for a genuine ES outage — permission-based fallback is expected behaviour, not an outage.
      if (esFailedTypes.size > 0 && !isStale()) setIsOffline(true);

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
      if (isStale()) return;
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
          // Online results are only fetched on a fresh search, so reuse the extra count from then.
          const tabTotal = loadMoreTab === 'asir' ? (asirES ? asirES.total + onlineExtraByTypeRef.current.asir : prev.totalsByType.asir)
            : loadMoreTab === 'soher' ? (soherES ? soherES.total + onlineExtraByTypeRef.current.soher : prev.totalsByType.soher)
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
        // asirES.total/soherES.total only count ES hits — online results can add people not in
        // that ES page, so the extra must be added on top to get the true overall total.
        const asirOnlineExtra = asirES ? asirMerged.length - asirES.results.length : 0;
        const soherOnlineExtra = soherES ? soherMerged.length - soherES.results.length : 0;
        onlineExtraByTypeRef.current = { asir: asirOnlineExtra, soher: soherOnlineExtra, ezrach: 0 };

        const totalsByType = {
          asir: asirES ? asirES.total + asirOnlineExtra : asirEnriched.length,
          soher: soherES ? soherES.total + soherOnlineExtra : soherEnriched.length,
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
    return () => {
      cancelPendingRequests();
      selectedPhotoAbortRef.current?.abort();
    };
  }, [cancelPendingRequests]);

  const setInputValue = useCallback((v: string) => {
    setInputValueState(v);
    setSelectedPerson(null);
    if (v.length < minChars) {
      // Below minChars no search will run, so nothing would supersede a search still in flight
      // for the longer text — cancel it explicitly or its results would land on an empty box.
      cancelPendingRequests();
      setResults(emptyResults);
      setError(null);
      setIsOffline(false);
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [minChars, cancelPendingRequests]);

  const setActiveTab = useCallback((tab: PersonType) => {
    setActiveTabState(tab);
  }, []);

  const selectPerson = useCallback(
    (person: PersonResult, options?: { refreshPhoto?: boolean }) => {
      justSelectedRef.current = true;
      setActiveTabState(person.personType);
      setInputValueState(String(person.data['fullName'] ?? ''));
      onSelect?.(person);

      if (!options?.refreshPhoto || !person.data['photoUrl']) {
        setSelectedPerson(person);
        return;
      }

      // Recent-search entries are read straight from localStorage and may carry a stale
      // photoUrl (e.g. an expired signed link) — strip it so we never render a broken
      // <img>, then resolve a fresh one in the background.
      const { photoUrl: _stale, ...restData } = person.data;
      const personWithoutPhoto = { ...person, data: restData };
      setSelectedPerson(personWithoutPhoto);

      selectedPhotoAbortRef.current?.abort();
      const controller = new AbortController();
      selectedPhotoAbortRef.current = controller;
      enrichPersonsWithPhotoUrls({ persons: [personWithoutPhoto], config, signal: controller.signal })
        .then(([enriched]) => {
          const freshUrl = enriched?.data['photoUrl'];
          if (!freshUrl) return;
          setSelectedPerson((prev) =>
            prev && prev.id === person.id && prev.personType === person.personType
              ? { ...prev, data: { ...prev.data, photoUrl: freshUrl } }
              : prev
          );
        })
        .catch(() => { /* best effort — keep the placeholder if the refresh fails */ });
    },
    [onSelect, config]
  );

  const clearSelection = useCallback(() => {
    cancelPendingRequests();
    setInputValueState('');
    setResults(emptyResults);
    setSelectedPerson(null);
    setError(null);
    setIsOffline(false);
    setIsLoading(false);
    setIsLoadingMore(false);
    resetPaging();
    onClear?.();
  }, [onClear, resetPaging, cancelPendingRequests]);

  const loadMore = useCallback(
    (tab: PersonType) => {
      if (debouncedInput.length < minChars) return;
      const key = tab === 'asir' ? 'asirs' : tab === 'soher' ? 'sohers' : 'ezrachs';
      if (!pagingState[key].hasMore || isLoadingMore) return;
      runSearch(debouncedInput, true, tab);
    },
    [debouncedInput, minChars, pagingState, isLoadingMore, runSearch]
  );

  const baseDisplayFields =
    buildEsConfig(config, null, remoteFieldConfig, effectiveSourceFields)
      .querySettings?.[activeTab]?.sourceFields
      ?? DEFAULT_QUERY_SETTINGS[activeTab].sourceFields;
  // The raw description blob is fetched only for extraction — swap it for its parsed keys
  // so the expanded card shows סטטוס/אזור instead of the blob itself.
  const displayFields =
    soherExpandedView && activeTab === 'soher'
      ? [
          ...baseDisplayFields.filter((f) => f !== DESCRIPTION_FIELD),
          ...SOHER_EXPANDED_DISPLAY_FIELDS,
        ]
      : baseDisplayFields;

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
    displayFields,
  };
}
