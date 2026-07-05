import { OfflineError } from './axiosInstance';
import type { ElasticQuerySettings, PersonResult, PersonType, ServiceConfig } from '../types';
export { OfflineError };
export declare const DEFAULT_QUERY_SETTINGS: Record<PersonType, ElasticQuerySettings>;
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
export declare function buildElasticQuery(settings: ElasticQuerySettings, { query, size, from }: {
    query: string;
    size: number;
    from: number;
}): Record<string, unknown>;
export declare function searchPersons(params: {
    query: string;
    personType: PersonType;
    /** Compiled Elasticsearch clause for the active Filter tree — see `compileToElasticQuery`. */
    filterClause?: Record<string, unknown>;
    offset: number;
    pageSize: number;
    activeOnly?: boolean;
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<{
    results: PersonResult[];
    hasMore: boolean;
    total: number;
}>;
export declare function fetchSinglePerson(params: {
    key: string;
    value: string;
    personType?: PersonType;
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<PersonResult | null>;
