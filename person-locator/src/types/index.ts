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
