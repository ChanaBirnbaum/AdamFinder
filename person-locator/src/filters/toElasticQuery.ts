import type { Filter } from './model';

type ESClause = Record<string, unknown>;

/**
 * Above this many values, Elasticsearch's own `terms` query gets slow/risky to inline
 * (and can hit `index.max_terms_count`). Prefer a terms lookup (a `terms` query whose
 * values come from another document's field, via `terms.index`/`terms.id`/`terms.path`)
 * instead of inlining the list.
 */
export const MAX_INLINE_TERMS = 1024;

function keywordField(field: string, value: unknown): string {
  if (field.endsWith('.keyword')) return field;
  return typeof value === 'string' ? `${field}.keyword` : field;
}

function keywordFieldForValues(field: string, values: unknown[]): string {
  if (field.endsWith('.keyword')) return field;
  return values.some((v) => typeof v === 'string') ? `${field}.keyword` : field;
}

function assertInlineable(field: string, values: unknown[]): void {
  if (values.length > MAX_INLINE_TERMS) {
    throw new Error(
      `Filter on "${field}" has ${values.length} values, over the inline limit of ${MAX_INLINE_TERMS}. ` +
        'Use an Elasticsearch terms lookup (a "terms" query referencing another document\'s id list) instead of inlining this many values.',
    );
  }
}

function buildRangeBounds(filter: { gte?: unknown; lte?: unknown; gt?: unknown; lt?: unknown }): Record<string, unknown> {
  const bounds: Record<string, unknown> = {};
  if (filter.gte !== undefined) bounds.gte = filter.gte;
  if (filter.lte !== undefined) bounds.lte = filter.lte;
  if (filter.gt !== undefined) bounds.gt = filter.gt;
  if (filter.lt !== undefined) bounds.lt = filter.lt;
  return bounds;
}

/**
 * Compiler A — turns a Filter tree into an Elasticsearch query clause.
 * Lives entirely in filter context (no scoring, cacheable) — the free-text search
 * stays in `must` alongside this, in `must`'s sibling `filter`/`must_not`/`should`.
 */
export function compileToElasticQuery<T>(filter: Filter<T>): ESClause {
  switch (filter.op) {
    case 'and':
      return { bool: { filter: filter.filters.map((f) => compileToElasticQuery(f)) } };
    case 'or':
      return {
        bool: { should: filter.filters.map((f) => compileToElasticQuery(f)), minimum_should_match: 1 },
      };
    case 'not':
      return { bool: { must_not: [compileToElasticQuery(filter.filter)] } };
    case 'eq': {
      const field = filter.field as string;
      return { term: { [keywordField(field, filter.value)]: filter.value } };
    }
    case 'in': {
      const field = filter.field as string;
      assertInlineable(field, filter.values);
      return { terms: { [keywordFieldForValues(field, filter.values)]: filter.values } };
    }
    case 'nin': {
      const field = filter.field as string;
      assertInlineable(field, filter.values);
      return { bool: { must_not: [{ terms: { [keywordFieldForValues(field, filter.values)]: filter.values } }] } };
    }
    case 'range': {
      const field = filter.field as string;
      return { range: { [field]: buildRangeBounds(filter) } };
    }
    case 'exists':
      return { exists: { field: filter.field as string } };
  }
}
