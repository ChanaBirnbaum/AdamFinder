// Public API barrel export
import './styles.css';

export { default as Toggle } from './components/Toggle';
export { SearchIcon, CitizenIcon, GuardIcon, PrisonerIcon, ProfilePlaceholder } from './components/icons';
export { default as Avatar } from './components/Avatar';
export { default as Badge } from './components/Badge';
export type { BadgeStatus } from './components/Badge';

export { default as PersonLocator } from './components/PersonLocator';
export { usePersonSearch } from './hooks/usePersonSearch';
export type { UsePersonSearchReturn } from './hooks/usePersonSearch';
export { mergeResults } from './utils/mergeResults';
export { highlightMatch } from './utils/highlightMatch';
export { OfflineError, initHttpClient } from './services/axiosInstance';
export type { HttpClientConfig } from './services/axiosInstance';
export { buildElasticQuery } from './services/elasticSearchService';
export * from './filters';

export type {
  PersonType,
  PersonResult,
  SearchResults,
  PagingState,
  SingleSearch,
  PersonLocatorProps,
  QueryWrapMode,
  AllowedListFilter,
  ScriptSort,
  ElasticQuerySettings,
} from './types';
