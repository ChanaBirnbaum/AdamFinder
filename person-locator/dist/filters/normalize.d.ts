import type { Filter, FilterInput } from './model';
/**
 * Collapses a single filter or an array of filters into one tree, so the rest of the
 * pipeline (both compilers) only ever has to deal with one shape.
 *   normalize(undefined)    → and()        (match all)
 *   normalize([f1, f2, f3]) → and(f1,f2,f3) (implicit AND across the array)
 *   normalize(f)            → f
 */
export declare function normalize<T>(input: FilterInput<T> | undefined): Filter<T>;
/**
 * ANDs a mandatory system-level base filter (permission scoping, forced exclusions) with
 * the user's filter. AND only narrows, so the base is always enforced and cannot be
 * bypassed by the user filter — and because it flows through the same tree, it applies
 * to the Elasticsearch query and to the online/offline predicates alike.
 *
 * When only one side is actually present, that side is returned as-is rather than
 * wrapped in an `and()` alongside an empty (match-all) branch.
 */
export declare function composeWithBase<T>(base: FilterInput<T> | undefined, user: FilterInput<T> | undefined): Filter<T>;
