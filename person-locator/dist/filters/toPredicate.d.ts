import type { Filter } from './model';
import type { FieldExceptionsMap } from './fieldExceptions';
/**
 * Compiler B — turns a Filter tree into a client-side predicate `(person) => boolean`,
 * used to filter the online/offline results the same way the Elasticsearch query does.
 *
 * Missing-field semantics mirror Elasticsearch exactly so all three sources agree:
 *   eq / in / range / exists → exclude (false) when the field is missing on the object
 *   nin                      → include (true)  when the field is missing on the object
 */
export declare function compileToPredicate<T>(filter: Filter<T>, exceptions?: FieldExceptionsMap): (person: T) => boolean;
