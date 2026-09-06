import type { FilterInput } from '../filters';

// Person categories
export type PersonType = 'asir' | 'soher' | 'ezrach';

// Deployment environment
export type Environment = 'dev' | 'test' | 'lrn' | 'prod';

// A single search result person
export interface PersonResult {
  id: string;           // Unique person ID (used for dedup)
  personType: PersonType;
  isActive: boolean;
  source: 'elasticsearch' | 'online' | 'offline';
  /** All fields returned from the service, keyed by their original field name.
   *  e.g. data['fullName'], data['idNumber'], data['rank'], data['prisonerNumber'] etc. */
  data: Record<string, unknown>;
}

// Grouped results per category
export interface SearchResults {
  asirs: PersonResult[];
  sohers: PersonResult[];
  ezrachs: PersonResult[];
  totalsByType: Record<PersonType, number>;
  totalCount: number;
}

// Paging state per category
export interface PagingState {
  asirs:   { offset: number; hasMore: boolean };
  sohers:  { offset: number; hasMore: boolean };
  ezrachs: { offset: number; hasMore: boolean };
}

// Single-search pre-fill
export interface SingleSearch {
  key: string;    // ES field name, e.g. "prisonerNumber"
  value: string;  // field value to look up
}

// ─── Elasticsearch query builder ───────────────────────────────────────────

/** Controls how the search term is wrapped inside the query_string value.
 *  - `'prefix'`   → `"term1 AND term2*"`   (good for IDs / prisoner numbers)
 *  - `'wildcard'` → `"*term1 AND term2*"`  (broader, used for guard search)
 *  - `'exact'`    → `"term1 AND term2"`    (no wildcards, used for citizens / single lookup) */
export type QueryWrapMode = 'prefix' | 'wildcard' | 'exact';

/** Restrict results to documents whose `field` value is in `values`. */
export interface AllowedListFilter {
  /** ES field name, e.g. `"idnt_asir"` */
  field: string;
  /** Allowed values — when empty the filter clause is omitted. */
  values: (string | number)[];
}

/**
 * Relevance tiers that rank an exact match above a merely-contained one.
 * Applied to every query regardless of `wrapMode` — see `buildElasticQuery`.
 * Set `scoreTiers: false` on a PersonType to opt out.
 */
export interface ScoreTiers {
  /**
   * Fields tested for whole-value equality via `term`.
   * Default: every entry of `searchFields` with `.keyword` appended.
   */
  exactFields?: string[];
  /** Whole field value equals the query. Default: `1000`. */
  exactBoost?: number;
  /** Query appears as a whole word/phrase inside the field. Default: `100`. */
  phraseBoost?: number;
  /** A word in the field starts with the query, at any position. Default: `10`. */
  prefixBoost?: number;
}

/** Script-based primary sort (added before `_score`). */
export interface ScriptSort {
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
export interface ElasticQuerySettings {
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
  scriptFields?: Record<string, { script: string }>;
  /** Primary sort by script — appended before `_score` sort. */
  scriptSort?: ScriptSort;
  /**
   * Ranking tiers pushing exact matches above partial ones. Enabled by default;
   * pass `false` to disable, or an object to tune boosts / exact-match fields.
   * Affects ordering only — never which documents match.
   */
  scoreTiers?: ScoreTiers | false;
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

// ─── Service endpoints ─────────────────────────────────────────────────────

export interface ServiceEndpoints {
  /** Base URL, no trailing slash */
  baseUrl: string;
  /** Named endpoint paths — add any key freely, no interface change needed.
   *  Use `{index}` as a placeholder where relevant, e.g. `/{index}/_search` */
  methods: Record<string, string>;
}

// Service config injected by consumer
export interface ServiceConfig {
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
  authToken?: string;   // Bearer token for all calls
  pageSize?: number;    // Default: 3
  timeoutMs?: number;   // Default: 5000
  /** Per-type query settings — override library defaults per PersonType. */
  querySettings?: Partial<Record<PersonType, ElasticQuerySettings>>;
}

// The root component props – EVERY prop must have JSDoc
export interface PersonLocatorProps {
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
