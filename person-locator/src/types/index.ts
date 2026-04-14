// Person categories
export type PersonType = 'asir' | 'soher' | 'ezrach';

// Deployment environment
export type Environment = 'dev' | 'test' | 'lrn' | 'prod';

// Filter operators
export type FilterOperator = 'equals' | 'exists' | 'gt' | 'lt' | 'contains';

export interface Filter {
  fieldName: string;
  value: string | number | null;
  operator: FilterOperator;
}

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
  authToken?: string;   // Bearer token for all calls
  pageSize?: number;    // Default: 3
  timeoutMs?: number;   // Default: 5000
  /** Per-type query settings — override library defaults per PersonType. */
  querySettings?: Partial<Record<PersonType, ElasticQuerySettings>>;
}

// The root component props – EVERY prop must have JSDoc
export interface PersonLocatorProps {
  /** Restrict search to one category. Omit to search all three. */
  type?: PersonType;

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

  /** Extra ES fields to return and display in result cards. */
  additionalResultFields?: string[];

  /** Dynamic filters applied to every ES query. */
  filters?: Filter[];

  /** Enable offline DB fallback when ES is unreachable. Default: false */
  enableOfflineSearch?: boolean;

  /** Pre-fill the component by fetching a person by this key/value from ES. Component stays editable. */
  singleSearch?: SingleSearch;

  /** Controlled selected person value. Pass null to clear. */
  state?: PersonResult | null;

  /** Callback to open external "prisoner file" system. Available in all modes. */
  openTikAsir?: (person: PersonResult) => void;

  /** Callback fired when the search input is cleared (manual or programmatic). */
  clearData?: () => void;

  /** react-router navigate function for icon-button navigation. */
  navigate?: (path: string) => void;

  /** Person types whose photos should be hidden. */
  HidePhotosSugAdam?: PersonType[];

  /** Hide shift/mishmoret data in result cards. */
  HideMishmorot?: boolean;

  /** Hide all navigation link buttons in result cards. */
  hideNavigationLinks?: boolean;

  /** Search only active persons. Hides the active toggle entirely. */
  activeOnly?: boolean;

  /** Default value for the active toggle (only when activeOnly is undefined). */
  isDefaultActive?: boolean;

  /** Deployment environment — determines which backend URLs the library uses. */
  env: Environment;
}
