import type { Filter } from './model';
import type { FieldExceptionsMap } from './fieldExceptions';
import { defaultFieldExceptions } from './fieldExceptions';

/** Deep-gets a dot-separated path off an object. Returns `undefined` on any missing intermediate key — never throws. */
function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function resolveObjectPath(field: string, exceptions: FieldExceptionsMap): string {
  const mapped = exceptions[field] ?? field;
  return mapped.endsWith('.keyword') ? mapped.slice(0, -'.keyword'.length) : mapped;
}

function resolveValue(person: unknown, field: string, exceptions: FieldExceptionsMap): unknown {
  return getByPath(person, resolveObjectPath(field, exceptions));
}

/** Loose equality so e.g. a numeric id `7` on Elasticsearch matches a string id `"7"` on the synced object. */
function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  const aComparable = typeof a === 'number' || typeof a === 'string' || typeof a === 'boolean';
  const bComparable = typeof b === 'number' || typeof b === 'string' || typeof b === 'boolean';
  return aComparable && bComparable && String(a) === String(b);
}

/** Coerces to a comparable number — the raw numeric value, or a timestamp for date-like strings. NaN if not comparable. */
function toComparable(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) return asNumber;
    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate)) return asDate;
  }
  return NaN;
}

/** Array-valued fields match if ANY element matches; scalar fields are tested directly. */
function matchesAny(resolved: unknown, test: (value: unknown) => boolean): boolean {
  return Array.isArray(resolved) ? resolved.some(test) : test(resolved);
}

/**
 * Compiler B — turns a Filter tree into a client-side predicate `(person) => boolean`,
 * used to filter the online/offline results the same way the Elasticsearch query does.
 *
 * Missing-field semantics mirror Elasticsearch exactly so all three sources agree:
 *   eq / in / range / exists → exclude (false) when the field is missing on the object
 *   nin                      → include (true)  when the field is missing on the object
 */
export function compileToPredicate<T>(
  filter: Filter<T>,
  exceptions: FieldExceptionsMap = defaultFieldExceptions,
): (person: T) => boolean {
  switch (filter.op) {
    case 'and': {
      const preds = filter.filters.map((f) => compileToPredicate(f, exceptions));
      return (person) => preds.every((p) => p(person));
    }
    case 'or': {
      const preds = filter.filters.map((f) => compileToPredicate(f, exceptions));
      return (person) => preds.some((p) => p(person));
    }
    case 'not': {
      const pred = compileToPredicate(filter.filter, exceptions);
      return (person) => !pred(person);
    }
    case 'eq': {
      const field = filter.field as string;
      const { value } = filter;
      return (person) => {
        const resolved = resolveValue(person, field, exceptions);
        if (resolved === undefined) return false;
        return matchesAny(resolved, (v) => looseEquals(v, value));
      };
    }
    case 'in': {
      const field = filter.field as string;
      const { values } = filter;
      return (person) => {
        const resolved = resolveValue(person, field, exceptions);
        if (resolved === undefined) return false;
        return matchesAny(resolved, (v) => values.some((target) => looseEquals(v, target)));
      };
    }
    case 'nin': {
      const field = filter.field as string;
      const { values } = filter;
      return (person) => {
        const resolved = resolveValue(person, field, exceptions);
        if (resolved === undefined) return true;
        return !matchesAny(resolved, (v) => values.some((target) => looseEquals(v, target)));
      };
    }
    case 'range': {
      const field = filter.field as string;
      const { gte, lte, gt, lt } = filter;
      return (person) => {
        const resolved = resolveValue(person, field, exceptions);
        if (resolved === undefined) return false;
        return matchesAny(resolved, (v) => {
          const n = toComparable(v);
          if (Number.isNaN(n)) return false;
          if (gte !== undefined && !(n >= toComparable(gte))) return false;
          if (lte !== undefined && !(n <= toComparable(lte))) return false;
          if (gt !== undefined && !(n > toComparable(gt))) return false;
          if (lt !== undefined && !(n < toComparable(lt))) return false;
          return true;
        });
      };
    }
    case 'exists': {
      const field = filter.field as string;
      return (person) => {
        const resolved = resolveValue(person, field, exceptions);
        if (Array.isArray(resolved)) return resolved.length > 0;
        return resolved !== undefined && resolved !== null;
      };
    }
  }
}
