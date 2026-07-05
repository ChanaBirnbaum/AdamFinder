import type { Filter } from './model';
type ESClause = Record<string, unknown>;
/**
 * Above this many values, Elasticsearch's own `terms` query gets slow/risky to inline
 * (and can hit `index.max_terms_count`). Prefer a terms lookup (a `terms` query whose
 * values come from another document's field, via `terms.index`/`terms.id`/`terms.path`)
 * instead of inlining the list.
 */
export declare const MAX_INLINE_TERMS = 1024;
/**
 * Compiler A — turns a Filter tree into an Elasticsearch query clause.
 * Lives entirely in filter context (no scoring, cacheable) — the free-text search
 * stays in `must` alongside this, in `must`'s sibling `filter`/`must_not`/`should`.
 */
export declare function compileToElasticQuery<T>(filter: Filter<T>): ESClause;
export {};
