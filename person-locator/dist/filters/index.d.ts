/**
 * Generic, source-agnostic filtering for PersonLocator.
 *
 * One filter model, two compilers: `compileToElasticQuery` turns it into an Elasticsearch
 * query clause, `compileToPredicate` turns it into a client-side `(person) => boolean` for
 * the online/offline sources — so the same filter selects the same people everywhere.
 *
 * @example
 * ```ts
 * import { eq, oneOf, noneOf, and, normalize, composeWithBase } from './filters';
 * import type { PersonResult } from '../types';
 *
 * // A single filter: prisoners in unit "A" or "B", excluding two specific id numbers.
 * const userFilter = and<PersonResult>(
 *   oneOf<PersonResult>('data.unit', ['A', 'B']),
 *   noneOf<PersonResult>('data.idNumber', ['123', '456']),
 * );
 *
 * // Equivalent — pass an array instead; entries are combined with an implicit AND.
 * const sameFilter = [
 *   oneOf<PersonResult>('data.unit', ['A', 'B']),
 *   noneOf<PersonResult>('data.idNumber', ['123', '456']),
 * ];
 *
 * // Mandatory, system-level scoping (e.g. a permission boundary) — always ANDed with the
 * // user's filter via composeWithBase, so the user filter can never widen past it.
 * const baseFilter = eq<PersonResult>('isActive', true);
 * const tree = normalize(composeWithBase(baseFilter, userFilter));
 *
 * const esClause = compileToElasticQuery(tree); // → bool.filter, alongside the free-text query in must
 * const predicate = compileToPredicate(tree);    // → applied to the online/offline results
 * ```
 */
export type { Path, FieldRef, ValueAtPath } from './path';
export type { Filter, FilterInput } from './model';
export { eq, oneOf, noneOf, range, and, or, not, exists } from './builder';
export { normalize, composeWithBase } from './normalize';
export type { FieldExceptionsMap } from './fieldExceptions';
export { defaultFieldExceptions } from './fieldExceptions';
export { compileToElasticQuery, MAX_INLINE_TERMS } from './toElasticQuery';
export { compileToPredicate } from './toPredicate';
