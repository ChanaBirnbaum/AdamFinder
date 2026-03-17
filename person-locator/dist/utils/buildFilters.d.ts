import type { Filter } from '../types';
type ESClause = Record<string, unknown>;
/**
 * Convert Filter[] to Elasticsearch bool query filter clauses.
 */
export declare function buildFilters(filters: Filter[]): ESClause[];
export {};
