
import { post, OfflineError } from './axiosInstance';
import type {
  ElasticQuerySettings,
  Filter,
  PersonResult,
  PersonType,
  ServiceConfig,
} from '../types';
import { buildFilters } from '../utils/buildFilters';

// ─── Index map ────────────────────────────────────────────────────────────────

const INDEX_MAP: Record<PersonType, string> = {
  asir:   'asirs',
  soher:  'sohers',
  ezrach: 'ezrachs',
};

// ─── Built-in default query settings per type ────────────────────────────────
// Consumers override these via ServiceConfig.querySettings

export const DEFAULT_QUERY_SETTINGS: Record<PersonType, ElasticQuerySettings> = {
  asir: {
    wrapMode:     'prefix',
    searchFields: ['fullName', 'idNumber', 'unit', 'prisonerNumber'],
    sourceFields: ['fullName', 'idNumber', 'unit', 'prisonerNumber', 'isActive', 'photoUrl'],
    activeField:  'isActive',
  },
  soher: {
    wrapMode:     'wildcard',
    searchFields: ['fullName', 'rank', 'unit', 'phone'],
    sourceFields: ['fullName', 'rank', 'unit', 'phone', 'isActive', 'photoUrl'],
    activeField:  'isActive',
  },
  ezrach: {
    wrapMode:     'exact',
    searchFields: ['fullName', 'idNumber', 'phone'],
    sourceFields: ['fullName', 'idNumber', 'phone', 'isActive', 'photoUrl'],
    activeField:  'isActive',
  },
};

// ─── Generic query builder ────────────────────────────────────────────────────

/**
 * Builds a complete Elasticsearch request body from a settings object.
 *
 * Structure produced (mirrors production queries):
 * ```
 * {
 *   [script_fields],          // optional — when settings.scriptFields is set
 *   query: { bool: { must: [
 *     { bool: {
 *         must: [
 *           { bool: { minimum_should_match: 1 } },
 *           { query_string: { query, fields } },
 *           ...requiredFields  → { exists }
 *           ...atLeastOneField → { bool: { should, minimum_should_match:1 } }
 *           ...conditions      (injected as-is)
 *         ],
 *         filter: { terms: { allowedList.field: [...] } }  // optional
 *     } }
 *   ] } },
 *   sort: [ { _script }, { _score: "desc" } ],   // or just _score
 *   _source: [...],
 *   size, from
 * }
 * ```
 */
export function buildElasticQuery(
  settings: ElasticQuerySettings,
  { query, size, from }: { query: string; size: number; from: number },
): Record<string, unknown> {
  // ── 1. Build query_string value ──────────────────────────────────────────
  const terms =
    settings.splitTerms !== false
      ? query.trim().split(/\s+/).filter(Boolean)
      : [query.trim()];

  const joined = terms.join(' AND ');
  let queryStr: string;
  switch (settings.wrapMode ?? 'prefix') {
    case 'wildcard': queryStr = `*${joined}*`; break;
    case 'exact':    queryStr = joined;         break;
    default:         queryStr = `${joined}*`;  break; // prefix
  }

  // ── 2. Inner must clauses ────────────────────────────────────────────────
  const innerMust: Record<string, unknown>[] = [
    { bool: { minimum_should_match: 1 } },
    { query_string: { query: queryStr, fields: settings.searchFields } },
    ...(settings.requiredFields ?? []).map((f) => ({ exists: { field: f } })),
    ...(settings.conditions ?? []),
  ];

  if (settings.atLeastOneField?.length) {
    innerMust.push({
      bool: {
        should: settings.atLeastOneField.map((f) => ({ exists: { field: f } })),
        minimum_should_match: 1,
      },
    });
  }

  // ── 3. Inner bool — optional allowedList terms filter ───────────────────
  const innerBool: Record<string, unknown> = { must: innerMust };
  if (settings.allowedList?.values.length) {
    innerBool['filter'] = {
      terms: { [settings.allowedList.field]: settings.allowedList.values },
    };
  }

  // ── 4. Sort ──────────────────────────────────────────────────────────────
  const sort: Record<string, unknown>[] = [];
  if (settings.scriptSort) {
    sort.push({
      _script: {
        script: settings.scriptSort.script,
        type:   settings.scriptSort.type  ?? 'number',
        order:  settings.scriptSort.order ?? 'desc',
      },
      _score: 'desc',
    });
  } else {
    sort.push({ _score: 'desc' });
  }

  // ── 5. Assemble body ─────────────────────────────────────────────────────
  const body: Record<string, unknown> = {
    query:   { bool: { must: [{ bool: innerBool }] } },
    sort,
    _source: settings.sourceFields,
    size,
    from,
  };

  if (settings.scriptFields) {
    body['script_fields'] = settings.scriptFields;
  }

  return body;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapHitToPersonResult(
  hit: Record<string, unknown>,
  personType: PersonType,
  activeField = 'isActive',
): PersonResult {
  const source = (hit['_source'] as Record<string, unknown>) ?? {};
  return {
    id:         String(hit['_id'] ?? source['id'] ?? ''),
    personType,
    isActive:   Boolean(source[activeField] ?? true),
    source:     'elasticsearch',
    data:       { ...source },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchPersons(params: {
  query: string;
  personType: PersonType;
  filters: Filter[];
  offset: number;
  pageSize: number;
  activeOnly?: boolean;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<{ results: PersonResult[]; hasMore: boolean }> {
  const {
    query,
    personType,
    filters,
    offset,
    pageSize,
    activeOnly,
    config,
    signal,
  } = params;

  // Merge consumer-provided settings on top of defaults
  const base = config.querySettings?.[personType] ?? DEFAULT_QUERY_SETTINGS[personType];

  const conditions: Record<string, unknown>[] = [
    ...(base.conditions ?? []),
    ...buildFilters(filters),
    ...(activeOnly ? [{ term: { [base.activeField ?? 'isActive']: true } }] : []),
    ...(base.personTypeField && base.personTypeValue
      ? [{ term: { [base.personTypeField]: base.personTypeValue } }]
      : []),
  ];

  const settings: ElasticQuerySettings = { ...base, conditions };

  const body = buildElasticQuery(settings, {
    query,
    size: pageSize,
    from: offset,
  });

  const searchPath = config.elasticsearch.methods['search'].replace('{index}', INDEX_MAP[personType]);

  const { data: raw } = await post<string>(
    `${config.elasticsearch.baseUrl}${searchPath}`,
    body,
    { signal },
  );

  const data: { hits: { hits: Array<Record<string, unknown>>; total?: { value: number } | number } } =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  const hits  = data.hits?.hits ?? [];
  const total = typeof data.hits?.total === 'object'
    ? (data.hits.total as { value: number }).value
    : (data.hits?.total as number | undefined) ?? hits.length;
  const hasMore = offset + hits.length < total;
  const results = hits.map((hit) =>
    mapHitToPersonResult(hit, personType, base.activeField),
  );

  return { results, hasMore };
}

export async function fetchSinglePerson(params: {
  key: string;
  value: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult | null> {
  const { key, value, personType, config, signal } = params;

  const indices  = personType ? [INDEX_MAP[personType]] : Object.values(INDEX_MAP);
  const indexStr = indices.join(',');

  // Collect source fields from all relevant types
  const sourceFields = personType
    ? (config.querySettings?.[personType] ?? DEFAULT_QUERY_SETTINGS[personType]).sourceFields
    : [...new Set(
        (['asir', 'soher', 'ezrach'] as PersonType[]).flatMap(
          (t) => (config.querySettings?.[t] ?? DEFAULT_QUERY_SETTINGS[t]).sourceFields,
        ),
      )];

  const settings: ElasticQuerySettings = {
    wrapMode:     'exact',
    splitTerms:   false,
    searchFields: [key],
    sourceFields,
  };

  const body = buildElasticQuery(settings, { query: value, size: 1, from: 0 });

  const searchPath = config.elasticsearch.methods['search'].replace('{index}', indexStr);

  let data: { hits: { hits: Array<Record<string, unknown>> } };
  try {
    const { data: raw } = await post<string>(
      `${config.elasticsearch.baseUrl}${searchPath}`,
      body,
      { signal },
    );
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (err instanceof OfflineError) throw err;
    return null; // 4xx — treat as not found
  }

  const hits = data.hits?.hits ?? [];
  if (hits.length === 0) return null;

  const hit = hits[0];
  const index = String(hit['_index'] ?? '');
  const resolvedType: PersonType =
    index.includes('asir')  ? 'asir'  :
    index.includes('soher') ? 'soher' :
    'ezrach';

  const activeField = (config.querySettings?.[personType ?? resolvedType] ?? DEFAULT_QUERY_SETTINGS[personType ?? resolvedType]).activeField;
  return mapHitToPersonResult(hit, personType ?? resolvedType, activeField);
}

