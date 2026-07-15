import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

type ToggleProps = {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    className?: string;
};
declare function Toggle({ checked, onChange, className }: ToggleProps): react_jsx_runtime.JSX.Element;

declare function SearchIcon({ className, size }: {
    className?: string;
    size?: number;
}): react_jsx_runtime.JSX.Element;
declare function CitizenIcon({ active, className, size }: {
    active?: boolean;
    className?: string;
    size?: number;
}): react_jsx_runtime.JSX.Element;
declare function GuardIcon({ className, size }: {
    className?: string;
    size?: number;
}): react_jsx_runtime.JSX.Element;
declare function PrisonerIcon({ className, size }: {
    className?: string;
    size?: number;
}): react_jsx_runtime.JSX.Element;
declare function ProfilePlaceholder({ photoUrl, online }: {
    photoUrl?: string;
    online?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function Avatar({ photoUrl, online, className, }: {
    photoUrl?: string;
    online?: boolean;
    className?: string;
}): react_jsx_runtime.JSX.Element;

type BadgeStatus = 'active' | 'future' | 'past';
declare function Badge({ status, label: labelOverride, className }: {
    status: BadgeStatus;
    label?: string;
    className?: string;
}): react_jsx_runtime.JSX.Element;

/** Primitive types that terminate path recursion. */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;
type IsPlainObject<T> = T extends Primitive ? false : T extends readonly unknown[] ? false : T extends (...args: never[]) => unknown ? false : true;
/** Decrements a bounded depth counter so the recursion below always terminates. */
type Prev<D extends number> = D extends 4 ? 3 : D extends 3 ? 2 : D extends 2 ? 1 : D extends 1 ? 0 : 0;
/**
 * All dot-separated key paths into `T`, up to 4 levels deep.
 * Known object shapes get real autocomplete; an open index signature (e.g. `Record<string, unknown>`)
 * collapses to a `${prefix}.${string}` pattern, which still accepts any field name under it.
 */
type Path<T, Depth extends number = 4> = Depth extends 0 ? never : T extends Primitive ? never : {
    [K in keyof T & string]: IsPlainObject<T[K]> extends true ? `${K}` | `${K}.${Path<T[K], Prev<Depth>>}` : `${K}`;
}[keyof T & string];
/**
 * A field reference: autocompletes known paths on `T` via `Path<T>`, but still accepts
 * any string — the set of filterable Elasticsearch fields is not closed to `T`'s shape.
 */
type FieldRef<T> = Path<T> | (string & {});
/** Resolves the value type at a known path `P` on `T`. Falls back to `unknown` once the path leaves typed territory. */
type ValueAtPath<T, P extends string> = P extends `${infer Head}.${infer Rest}` ? Head extends keyof T ? ValueAtPath<T[Head], Rest> : unknown : P extends keyof T ? T[P] : unknown;

/**
 * Declarative filter tree. One source of truth, compiled two ways:
 * `compileToElasticQuery` (Elasticsearch) and `compileToPredicate` (online/offline, client-side).
 */
type Filter<T> = {
    op: 'and';
    filters: Filter<T>[];
} | {
    op: 'or';
    filters: Filter<T>[];
} | {
    op: 'not';
    filter: Filter<T>;
} | {
    op: 'eq';
    field: FieldRef<T>;
    value: unknown;
} | {
    op: 'in';
    field: FieldRef<T>;
    values: unknown[];
} | {
    op: 'nin';
    field: FieldRef<T>;
    values: unknown[];
} | {
    op: 'range';
    field: FieldRef<T>;
    gte?: unknown;
    lte?: unknown;
    gt?: unknown;
    lt?: unknown;
} | {
    op: 'exists';
    field: FieldRef<T>;
};
/** What a consumer may pass in: a single filter, or a list treated as an implicit AND. Never a raw Elasticsearch query. */
type FilterInput<T> = Filter<T> | Filter<T>[];

type ValueFor<T, P extends FieldRef<T>> = P extends Path<T> ? ValueAtPath<T, P> : unknown;
/** Field equals value (Elasticsearch `term`). */
declare function eq<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, value: ValueFor<T, P>): Filter<T>;
/** Field matches any of the given values (Elasticsearch `terms`). */
declare function oneOf<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, values: ReadonlyArray<ValueFor<T, P>>): Filter<T>;
/** Field matches none of the given values (Elasticsearch `must_not` over `terms`). */
declare function noneOf<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, values: ReadonlyArray<ValueFor<T, P>>): Filter<T>;
/** Field falls within the given bounds (Elasticsearch `range`). At least one bound should be set. */
declare function range<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, bounds: {
    gte?: ValueFor<T, P>;
    lte?: ValueFor<T, P>;
    gt?: ValueFor<T, P>;
    lt?: ValueFor<T, P>;
}): Filter<T>;
/** Field must be present (non-null) on the document. */
declare function exists<T = unknown>(field: FieldRef<T>): Filter<T>;
/** Combine filters — a document must match ALL of them. */
declare function and<T = unknown>(...filters: Filter<T>[]): Filter<T>;
/** Combine filters — a document must match AT LEAST ONE of them. */
declare function or<T = unknown>(...filters: Filter<T>[]): Filter<T>;
/** Negate a filter. */
declare function not<T = unknown>(filter: Filter<T>): Filter<T>;

/**
 * Collapses a single filter or an array of filters into one tree, so the rest of the
 * pipeline (both compilers) only ever has to deal with one shape.
 *   normalize(undefined)    → and()        (match all)
 *   normalize([f1, f2, f3]) → and(f1,f2,f3) (implicit AND across the array)
 *   normalize(f)            → f
 */
declare function normalize<T>(input: FilterInput<T> | undefined): Filter<T>;
/**
 * ANDs a mandatory system-level base filter (permission scoping, forced exclusions) with
 * the user's filter. AND only narrows, so the base is always enforced and cannot be
 * bypassed by the user filter — and because it flows through the same tree, it applies
 * to the Elasticsearch query and to the online/offline predicates alike.
 *
 * When only one side is actually present, that side is returned as-is rather than
 * wrapped in an `and()` alongside an empty (match-all) branch.
 */
declare function composeWithBase<T>(base: FilterInput<T> | undefined, user: FilterInput<T> | undefined): Filter<T>;

/** Maps an Elasticsearch field path to the differently-shaped path on the synced object (online/offline/PersonResult.data). */
type FieldExceptionsMap = Record<string, string>;
/**
 * Known mismatches between an Elasticsearch field path and the client-side object path.
 * Empty by default — for most fields the path is identical on both sides (modulo a
 * trailing `.keyword`, which `compileToPredicate` strips automatically). Add an entry
 * here only when a real mismatch is found, e.g. `unitId: 'unit.id'` if Elasticsearch
 * stores `unitId` but the synced object nests it under `unit.id`.
 */
declare const defaultFieldExceptions: FieldExceptionsMap;

type ESClause = Record<string, unknown>;
/**
 * Above this many values, Elasticsearch's own `terms` query gets slow/risky to inline
 * (and can hit `index.max_terms_count`). Prefer a terms lookup (a `terms` query whose
 * values come from another document's field, via `terms.index`/`terms.id`/`terms.path`)
 * instead of inlining the list.
 */
declare const MAX_INLINE_TERMS = 1024;
/**
 * Compiler A — turns a Filter tree into an Elasticsearch query clause.
 * Lives entirely in filter context (no scoring, cacheable) — the free-text search
 * stays in `must` alongside this, in `must`'s sibling `filter`/`must_not`/`should`.
 */
declare function compileToElasticQuery<T>(filter: Filter<T>): ESClause;

/**
 * Compiler B — turns a Filter tree into a client-side predicate `(person) => boolean`,
 * used to filter the online/offline results the same way the Elasticsearch query does.
 *
 * Missing-field semantics mirror Elasticsearch exactly so all three sources agree:
 *   eq / in / range / exists → exclude (false) when the field is missing on the object
 *   nin                      → include (true)  when the field is missing on the object
 */
declare function compileToPredicate<T>(filter: Filter<T>, exceptions?: FieldExceptionsMap): (person: T) => boolean;

type PersonType = 'asir' | 'soher' | 'ezrach';
type Environment = 'dev' | 'test' | 'lrn' | 'prod';
interface PersonResult {
    id: string;
    personType: PersonType;
    isActive: boolean;
    source: 'elasticsearch' | 'online' | 'offline';
    /** All fields returned from the service, keyed by their original field name.
     *  e.g. data['fullName'], data['idNumber'], data['rank'], data['prisonerNumber'] etc. */
    data: Record<string, unknown>;
}
interface SearchResults {
    asirs: PersonResult[];
    sohers: PersonResult[];
    ezrachs: PersonResult[];
    totalsByType: Record<PersonType, number>;
    totalCount: number;
}
interface PagingState {
    asirs: {
        offset: number;
        hasMore: boolean;
    };
    sohers: {
        offset: number;
        hasMore: boolean;
    };
    ezrachs: {
        offset: number;
        hasMore: boolean;
    };
}
interface SingleSearch {
    key: string;
    value: string;
}
/** Controls how the search term is wrapped inside the query_string value.
 *  - `'prefix'`   → `"term1 AND term2*"`   (good for IDs / prisoner numbers)
 *  - `'wildcard'` → `"*term1 AND term2*"`  (broader, used for guard search)
 *  - `'exact'`    → `"term1 AND term2"`    (no wildcards, used for citizens / single lookup) */
type QueryWrapMode = 'prefix' | 'wildcard' | 'exact';
/** Restrict results to documents whose `field` value is in `values`. */
interface AllowedListFilter {
    /** ES field name, e.g. `"idnt_asir"` */
    field: string;
    /** Allowed values — when empty the filter clause is omitted. */
    values: (string | number)[];
}
/** Script-based primary sort (added before `_score`). */
interface ScriptSort {
    script: string;
    type?: 'number' | 'string';
    order?: 'asc' | 'desc';
}
/**
 * Full settings describing how to build an Elasticsearch query for one PersonType.
 * Pass via `ServiceConfig.querySettings` to override library defaults.
 *
 * @example — Prisoners with allowed-list guard
 * ```ts
 * asir: {
 *   wrapMode: 'prefix',
 *   searchFields: ['text_name_prati', 'text_name_mishpacha^2', 'idnt_asir'],
 *   sourceFields: ['idnt_adam', 'text_name_prati', 'text_name_mishpacha', 'idnt_asir'],
 *   allowedList: { field: 'idnt_asir', values: allowedAsirimList },
 *   conditions: [Condition_Active_Asirim],
 * }
 * ```
 */
interface ElasticQuerySettings {
    /** How the search term is wrapped in `query_string`. Default: `'prefix'`. */
    wrapMode?: QueryWrapMode;
    /** Split whitespace into terms and join with `AND`. Default: `true`. */
    splitTerms?: boolean;
    /** Fields to search in. Supports Lucene boost notation e.g. `"fieldName^25"`. */
    searchFields: string[];
    /** Fields to return in `_source`. */
    sourceFields: string[];
    /** Each field generates an `{ exists: { field } }` must clause. */
    requiredFields?: string[];
    /** At least one of these fields must exist in the document. */
    atLeastOneField?: string[];
    /** Raw ES bool clauses injected into the inner `bool.must`. */
    conditions?: Record<string, unknown>[];
    /** Restrict results to a set of document IDs on a given field. */
    allowedList?: AllowedListFilter | null;
    /** Computed fields added as ES `script_fields`. */
    scriptFields?: Record<string, {
        script: string;
    }>;
    /** Primary sort by script — appended before `_score` sort. */
    scriptSort?: ScriptSort;
    /**
     * The document field that represents the active/inactive state.
     * Used when `activeOnly` filtering is requested.
     * Default: `'isActive'`.
     */
    activeField?: string;
    /**
     * The document field that holds the person type (e.g. `'sugAdam'`).
     * When set together with `personTypeValue`, a `term` filter is injected
     * so each query only returns documents of the correct type.
     */
    personTypeField?: string;
    /** The value to match against `personTypeField` for this person type. */
    personTypeValue?: string;
}
interface ServiceEndpoints {
    /** Base URL, no trailing slash */
    baseUrl: string;
    /** Named endpoint paths — add any key freely, no interface change needed.
     *  Use `{index}` as a placeholder where relevant, e.g. `/{index}/_search` */
    methods: Record<string, string>;
}
interface ServiceConfig {
    elasticsearch: ServiceEndpoints;
    online: ServiceEndpoints;
    offline: ServiceEndpoints;
    /** Optional photo service for resolving image URLs by person id. */
    photos?: ServiceEndpoints;
    /**
     * Prisoner whitelist endpoint (מידור) — when set, called once on mount.
     * The server returns an array of prisoner IDs the user may see.
     * These are injected as a `terms` filter into every Elasticsearch asir query.
     * If the server returns an empty array or omitted → no restriction applied.
     */
    asirWhitelist?: ServiceEndpoints;
    /**
     * Permission check endpoint (הרשאת איתור) — used together with `fallbackToOfflineIfNoAuth`.
     * Called once on mount to determine if the user has any asir-search permission at all.
     * HTTP 200 → has permission. HTTP 403 → no permission → offline fallback.
     * If omitted or request fails → fail-open (search ES normally).
     */
    asirPermission?: ServiceEndpoints;
    /**
     * Remote field config endpoint — when set, called once on mount to fetch `searchFields`/
     * `sourceFields` per `PersonType` from the server, instead of the library's hardcoded
     * `DEFAULT_QUERY_SETTINGS`. Lets data owners add/remove indexed fields without a client change.
     * Other `ElasticQuerySettings` (wrapMode, activeField, conditions, etc.) are untouched — only
     * `searchFields`/`sourceFields` are overridden, per type, for whichever types the server returns.
     * If omitted or the request fails → fail-open (use `querySettings`/`DEFAULT_QUERY_SETTINGS`).
     */
    fieldConfig?: ServiceEndpoints;
    authToken?: string;
    pageSize?: number;
    timeoutMs?: number;
    /** Per-type query settings — override library defaults per PersonType. */
    querySettings?: Partial<Record<PersonType, ElasticQuerySettings>>;
}
interface PersonLocatorProps {
    /** Restrict search to one or more categories. Omit to search all three. */
    type?: PersonType | PersonType[];
    /** Minimum characters before triggering search. Default: 3 */
    minChars?: number;
    /** Fires when user selects a person from the list. */
    onSelect?: (person: PersonResult) => void;
    /** Disables all input and interaction. */
    disabled?: boolean;
    /** Direction the results dropdown opens. Default: 'down' */
    resultDirection?: 'up' | 'down';
    /** Extra ES index fields to include in the search query. */
    additionalSearchFields?: string[];
    /**
     * User-facing filter, applied identically against Elasticsearch and the online/offline
     * results. A single Filter, or an array (combined with an implicit AND). See `src/filters`.
     */
    filters?: FilterInput<PersonResult>;
    /**
     * Mandatory system-level filter (permission scoping, forced exclusions) — always ANDed
     * with `filters` so it cannot be widened or bypassed by the user filter. See `src/filters`.
     */
    baseFilter?: FilterInput<PersonResult>;
    /**
     * When `true`, the library calls the `asirPermission` endpoint before each search.
     * - HTTP 200 (has permission) → search ES normally.
     * - HTTP 403 (no permission) → fall back to the offline service for asirs.
     * Requires `serviceConfig.asirPermission` to be configured.
     * Default: false
     */
    fallbackToOfflineIfNoAuth?: boolean;
    /** Pre-fill the component by fetching a person by this key/value from ES. Component stays editable. */
    singleSearch?: SingleSearch;
    /** Controlled selected person value. Pass null to clear. */
    state?: PersonResult | null;
    /** Callback to open external "prisoner file" system. Available in all modes. */
    openTikAsir?: (person: PersonResult) => void;
    /** Callback fired when the search input is cleared (manual or programmatic). */
    onClear?: () => void;
    /** react-router navigate function for icon-button navigation. */
    navigate?: (path: string) => void;
    /** Person types whose photos should be hidden. */
    HidePhotosSugAdam?: PersonType[];
    /** Person types for which the ID number (ת"ז) should be shown in the result card. Hidden by default. */
    displayIdNumber?: PersonType[];
    /** Hide shift/mishmoret data in result cards. */
    HideMishmorot?: boolean;
    /** Hide all navigation link buttons in result cards. */
    hideNavigationLinks?: boolean;
    /**
     * Extra ES `_source` fields to fetch and display in the expanded card, per person type.
     * Merged on top of the type's default `sourceFields` — standard fields are preserved.
     * @example `additionalSourceFields={{ soher: ['badge', 'station'] }}`
     */
    additionalSourceFields?: Partial<Record<PersonType, string[]>>;
    /**
     * תצוגה מורחבת לסוהרים — when `true`, fetches the soher description blob from ES
     * and shows the סטטוס/אזור headers extracted from it in the expanded card.
     * Default: false
     */
    soherExpandedView?: boolean;
    /** Search only active persons. Hides the active toggle entirely. */
    activeOnly?: boolean;
    /** Default value for the active toggle (only when activeOnly is undefined). */
    isDefaultActive?: boolean;
    /** Deployment environment — determines which backend URLs the library uses. */
    env: Environment;
    /** Override the service config (URLs, page size, query settings). Useful for testing / mock mode. */
    serviceConfig?: Partial<ServiceConfig>;
}

declare const PersonLocator: React.FC<PersonLocatorProps>;

interface UsePersonSearchReturn {
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
declare function usePersonSearch(props: PersonLocatorProps): UsePersonSearchReturn;

/**
 * Merge ES results and online/DB results, deduplicating by person.id.
 * Online results take priority over ES on duplicate ID.
 * Final order: online results first, then ES-only results.
 */
declare function mergeResults(esResults: PersonResult[], onlineResults: PersonResult[]): PersonResult[];

/**
 * Return an array of React nodes with the matched substring bolded.
 * Case-insensitive match.
 */
declare function highlightMatch(text: string, query: string): React.ReactNode;

/** Thrown when ES / backend is unreachable or returns 5xx. */
declare class OfflineError extends Error {
    constructor(message: string);
}
interface HttpClientConfig extends AxiosRequestConfig {
    timeout?: number;
    getHeaders?: () => Record<string, string>;
    /** Hook שרץ על כל תגובה מוצלחת לפני שהיא מוחזרת לקורא */
    onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    /** Hook שרץ על כל שגיאת רשת / HTTP לפני שהיא נזרקת */
    onResponseError?: (error: AxiosError) => unknown;
}
declare function initHttpClient(config: HttpClientConfig, force?: boolean): void;

/**
 * Builds a complete Elasticsearch request body from a settings object.
 *
 * Structure produced (mirrors production queries):
 * ```
 * {
 *   [script_fields],          // optional — when settings.scriptFields is set
 *   query: { bool: { must: [
 *     { bool: {
 *         must: [
 *           { bool: { minimum_should_match: 1 } },
 *           { query_string: { query, fields } },
 *           ...requiredFields  → { exists }
 *           ...atLeastOneField → { bool: { should, minimum_should_match:1 } }
 *           ...conditions      (injected as-is)
 *         ],
 *         filter: { terms: { allowedList.field: [...] } }  // optional
 *     } }
 *   ] } },
 *   sort: [ { _script }, { _score: "desc" } ],   // or just _score
 *   _source: [...],
 *   size, from
 * }
 * ```
 */
declare function buildElasticQuery(settings: ElasticQuerySettings, { query, size, from }: {
    query: string;
    size: number;
    from: number;
}): Record<string, unknown>;

export { type AllowedListFilter, Avatar, Badge, type BadgeStatus, CitizenIcon, type ElasticQuerySettings, type FieldExceptionsMap, type FieldRef, type Filter, type FilterInput, GuardIcon, type HttpClientConfig, MAX_INLINE_TERMS, OfflineError, type PagingState, type Path, PersonLocator, type PersonLocatorProps, type PersonResult, type PersonType, PrisonerIcon, ProfilePlaceholder, type QueryWrapMode, type ScriptSort, SearchIcon, type SearchResults, type SingleSearch, Toggle, type UsePersonSearchReturn, type ValueAtPath, and, buildElasticQuery, compileToElasticQuery, compileToPredicate, composeWithBase, defaultFieldExceptions, eq, exists, highlightMatch, initHttpClient, mergeResults, noneOf, normalize, not, oneOf, or, range, usePersonSearch };
