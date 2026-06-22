/** Shared fixtures for the filters test suite. */
export interface TestPerson {
  id: string;
  isActive: boolean;
  data: {
    fullName?: string;
    unit?: string;
    idNumber?: string;
    rank?: number;
    tags?: string[];
    phone?: string;
  };
}

export function makePerson(overrides: Partial<TestPerson> & { id: string }): TestPerson {
  return {
    isActive: true,
    data: {},
    ...overrides,
  };
}

/**
 * A tiny, independent mock Elasticsearch query evaluator — walks the same clause shapes
 * `compileToElasticQuery` produces (bool/term/terms/range/exists) and applies them to a
 * plain document, the way a real ES `filter` context would. Used to cross-check the
 * predicate compiler against the ES compiler without sharing any implementation.
 */
export function evalEsClause(clause: Record<string, unknown>, doc: unknown): boolean {
  if ('bool' in clause) {
    const bool = clause.bool as { filter?: unknown[]; should?: unknown[]; must_not?: unknown[] };
    let result = true;
    if (bool.filter) result = result && bool.filter.every((c) => evalEsClause(c as Record<string, unknown>, doc));
    if (bool.should) result = result && bool.should.some((c) => evalEsClause(c as Record<string, unknown>, doc));
    if (bool.must_not) result = result && !bool.must_not.some((c) => evalEsClause(c as Record<string, unknown>, doc));
    return result;
  }
  if ('term' in clause) {
    const [field, value] = Object.entries(clause.term as Record<string, unknown>)[0];
    return matchesTerm(getPath(doc, stripKeyword(field)), value);
  }
  if ('terms' in clause) {
    const [field, values] = Object.entries(clause.terms as Record<string, unknown>)[0];
    const resolved = getPath(doc, stripKeyword(field));
    return (values as unknown[]).some((v) => matchesTerm(resolved, v));
  }
  if ('range' in clause) {
    const [field, bounds] = Object.entries(clause.range as Record<string, Record<string, unknown>>)[0];
    return matchesRange(getPath(doc, field), bounds);
  }
  if ('exists' in clause) {
    const resolved = getPath(doc, (clause.exists as { field: string }).field);
    return Array.isArray(resolved) ? resolved.length > 0 : resolved !== undefined && resolved !== null;
  }
  throw new Error(`evalEsClause: unrecognized clause ${JSON.stringify(clause)}`);
}

function stripKeyword(field: string): string {
  return field.endsWith('.keyword') ? field.slice(0, -'.keyword'.length) : field;
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function matchesTerm(resolved: unknown, target: unknown): boolean {
  if (resolved === undefined) return false;
  const test = (v: unknown) => String(v) === String(target);
  return Array.isArray(resolved) ? resolved.some(test) : test(resolved);
}

function matchesRange(resolved: unknown, bounds: Record<string, unknown>): boolean {
  if (resolved === undefined) return false;
  const test = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) return false;
    if (bounds.gte !== undefined && !(n >= (bounds.gte as number))) return false;
    if (bounds.lte !== undefined && !(n <= (bounds.lte as number))) return false;
    if (bounds.gt !== undefined && !(n > (bounds.gt as number))) return false;
    if (bounds.lt !== undefined && !(n < (bounds.lt as number))) return false;
    return true;
  };
  return Array.isArray(resolved) ? resolved.some(test) : test(resolved);
}
