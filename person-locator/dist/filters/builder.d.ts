import type { FieldRef, Path, ValueAtPath } from './path';
import type { Filter } from './model';
type ValueFor<T, P extends FieldRef<T>> = P extends Path<T> ? ValueAtPath<T, P> : unknown;
/** Field equals value (Elasticsearch `term`). */
export declare function eq<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, value: ValueFor<T, P>): Filter<T>;
/** Field matches any of the given values (Elasticsearch `terms`). */
export declare function oneOf<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, values: ReadonlyArray<ValueFor<T, P>>): Filter<T>;
/** Field matches none of the given values (Elasticsearch `must_not` over `terms`). */
export declare function noneOf<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, values: ReadonlyArray<ValueFor<T, P>>): Filter<T>;
/** Field falls within the given bounds (Elasticsearch `range`). At least one bound should be set. */
export declare function range<T = unknown, P extends FieldRef<T> = FieldRef<T>>(field: P, bounds: {
    gte?: ValueFor<T, P>;
    lte?: ValueFor<T, P>;
    gt?: ValueFor<T, P>;
    lt?: ValueFor<T, P>;
}): Filter<T>;
/** Field must be present (non-null) on the document. */
export declare function exists<T = unknown>(field: FieldRef<T>): Filter<T>;
/** Combine filters — a document must match ALL of them. */
export declare function and<T = unknown>(...filters: Filter<T>[]): Filter<T>;
/** Combine filters — a document must match AT LEAST ONE of them. */
export declare function or<T = unknown>(...filters: Filter<T>[]): Filter<T>;
/** Negate a filter. */
export declare function not<T = unknown>(filter: Filter<T>): Filter<T>;
export {};
