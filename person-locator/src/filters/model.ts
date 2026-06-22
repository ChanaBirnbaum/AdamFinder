import type { FieldRef } from './path';

/**
 * Declarative filter tree. One source of truth, compiled two ways:
 * `compileToElasticQuery` (Elasticsearch) and `compileToPredicate` (online/offline, client-side).
 */
export type Filter<T> =
  | { op: 'and'; filters: Filter<T>[] }
  | { op: 'or'; filters: Filter<T>[] }
  | { op: 'not'; filter: Filter<T> }
  | { op: 'eq'; field: FieldRef<T>; value: unknown }
  | { op: 'in'; field: FieldRef<T>; values: unknown[] }
  | { op: 'nin'; field: FieldRef<T>; values: unknown[] }
  | { op: 'range'; field: FieldRef<T>; gte?: unknown; lte?: unknown; gt?: unknown; lt?: unknown }
  | { op: 'exists'; field: FieldRef<T> };

/** What a consumer may pass in: a single filter, or a list treated as an implicit AND. Never a raw Elasticsearch query. */
export type FilterInput<T> = Filter<T> | Filter<T>[];
