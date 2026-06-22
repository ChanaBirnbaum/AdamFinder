import type { FieldRef, Path, ValueAtPath } from './path';
import type { Filter } from './model';

type ValueFor<T, P extends FieldRef<T>> = P extends Path<T> ? ValueAtPath<T, P> : unknown;

/** Field equals value (Elasticsearch `term`). */
export function eq<T = unknown, P extends FieldRef<T> = FieldRef<T>>(
  field: P,
  value: ValueFor<T, P>,
): Filter<T> {
  return { op: 'eq', field, value };
}

/** Field matches any of the given values (Elasticsearch `terms`). */
export function oneOf<T = unknown, P extends FieldRef<T> = FieldRef<T>>(
  field: P,
  values: ReadonlyArray<ValueFor<T, P>>,
): Filter<T> {
  return { op: 'in', field, values: [...values] };
}

/** Field matches none of the given values (Elasticsearch `must_not` over `terms`). */
export function noneOf<T = unknown, P extends FieldRef<T> = FieldRef<T>>(
  field: P,
  values: ReadonlyArray<ValueFor<T, P>>,
): Filter<T> {
  return { op: 'nin', field, values: [...values] };
}

/** Field falls within the given bounds (Elasticsearch `range`). At least one bound should be set. */
export function range<T = unknown, P extends FieldRef<T> = FieldRef<T>>(
  field: P,
  bounds: { gte?: ValueFor<T, P>; lte?: ValueFor<T, P>; gt?: ValueFor<T, P>; lt?: ValueFor<T, P> },
): Filter<T> {
  return { op: 'range', field, ...bounds };
}

/** Field must be present (non-null) on the document. */
export function exists<T = unknown>(field: FieldRef<T>): Filter<T> {
  return { op: 'exists', field };
}

/** Combine filters — a document must match ALL of them. */
export function and<T = unknown>(...filters: Filter<T>[]): Filter<T> {
  return { op: 'and', filters };
}

/** Combine filters — a document must match AT LEAST ONE of them. */
export function or<T = unknown>(...filters: Filter<T>[]): Filter<T> {
  return { op: 'or', filters };
}

/** Negate a filter. */
export function not<T = unknown>(filter: Filter<T>): Filter<T> {
  return { op: 'not', filter };
}
