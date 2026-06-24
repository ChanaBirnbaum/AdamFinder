import { and } from './builder';
import type { Filter, FilterInput } from './model';

/**
 * Collapses a single filter or an array of filters into one tree, so the rest of the
 * pipeline (both compilers) only ever has to deal with one shape.
 *   normalize(undefined)    → and()        (match all)
 *   normalize([f1, f2, f3]) → and(f1,f2,f3) (implicit AND across the array)
 *   normalize(f)            → f
 */
export function normalize<T>(input: FilterInput<T> | undefined): Filter<T> {
  if (input === undefined) return and<T>();
  if (Array.isArray(input)) return and<T>(...input);
  return input;
}

function isEmptyInput<T>(input: FilterInput<T> | undefined): boolean {
  return input === undefined || (Array.isArray(input) && input.length === 0);
}

/**
 * ANDs a mandatory system-level base filter (permission scoping, forced exclusions) with
 * the user's filter. AND only narrows, so the base is always enforced and cannot be
 * bypassed by the user filter — and because it flows through the same tree, it applies
 * to the Elasticsearch query and to the online/offline predicates alike.
 *
 * When only one side is actually present, that side is returned as-is rather than
 * wrapped in an `and()` alongside an empty (match-all) branch.
 */
export function composeWithBase<T>(
  base: FilterInput<T> | undefined,
  user: FilterInput<T> | undefined,
): Filter<T> {
  const baseEmpty = isEmptyInput(base);
  const userEmpty = isEmptyInput(user);
  if (baseEmpty && userEmpty) return and<T>();
  if (baseEmpty) return normalize(user);
  if (userEmpty) return normalize(base);
  return and<T>(normalize(base), normalize(user));
}
