import type { Filter, PersonResult, PersonType, ServiceConfig } from '../types';
import { buildFilters } from '../utils/buildFilters';

/** Custom error thrown when ES is unreachable or returns 5xx. */
export class OfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineError';
  }
}

const DEFAULT_FIELDS: Record<PersonType, string[]> = {
  asir: ['fullName', 'idNumber', 'unit', 'prisonerNumber'],
  soher: ['fullName', 'rank', 'unit', 'phone'],
  ezrach: ['fullName', 'idNumber', 'phone'],
};

const DEFAULT_RESULT_FIELDS: Record<PersonType, string[]> = {
  asir: ['fullName', 'idNumber', 'unit', 'prisonerNumber', 'isActive', 'photoUrl'],
  soher: ['fullName', 'rank', 'unit', 'phone', 'isActive', 'photoUrl'],
  ezrach: ['fullName', 'idNumber', 'phone', 'isActive', 'photoUrl'],
};

const INDEX_MAP: Record<PersonType, string> = {
  asir: 'asirs',
  soher: 'sohers',
  ezrach: 'ezrachs',
};

function buildHeaders(config: ServiceConfig): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (config.authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${config.authToken}`;
  }
  return headers;
}

const TYPED_PERSON_FIELDS = new Set([
  'fullName', 'idNumber', 'unit', 'rank', 'phone', 'shibutz', 'prisonerNumber', 'isActive', 'photoUrl',
]);

function mapHitToPersonResult(
  hit: Record<string, unknown>,
  personType: PersonType,
): PersonResult {
  const source = (hit._source as Record<string, unknown>) ?? {};

  return {
    id: String(hit._id ?? source['id'] ?? ''),
    personType,
    isActive: Boolean(source['isActive'] ?? true),
    source: 'elasticsearch',
    data: { ...source },
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal
        ? // Combine external signal with timeout signal
          (() => {
            const combined = new AbortController();
            (options.signal as AbortSignal).addEventListener('abort', () => combined.abort());
            controller.signal.addEventListener('abort', () => combined.abort());
            return combined.signal;
          })()
        : controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function searchPersons(params: {
  query: string;
  personType: PersonType;
  filters: Filter[];
  additionalSearchFields: string[];
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
    additionalSearchFields,
    offset,
    pageSize,
    activeOnly,
    config,
    signal,
  } = params;

  const timeoutMs = config.timeoutMs ?? 5000;
  const index = INDEX_MAP[personType];
  const searchFields = [...DEFAULT_FIELDS[personType], ...additionalSearchFields];

  const filterClauses = buildFilters(filters);
  if (activeOnly) {
    filterClauses.push({ term: { isActive: true } });
  }

  const body = {
    from: offset,
    size: pageSize + 1, // fetch one extra to determine hasMore
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: searchFields,
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
        filter: filterClauses,
      },
    },
  };

  const searchPath = config.elasticsearch.methods.search.replace('{index}', index);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${config.elasticsearch.baseUrl}${searchPath}`,
      {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify(body),
        signal,
      },
      timeoutMs
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new OfflineError(`ES request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (response.status >= 500) {
    throw new OfflineError(`ES returned ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`ES error: ${response.status}`);
  }

  const data = (await response.json()) as {
    hits: { hits: Array<Record<string, unknown>> };
  };

  const hits = data.hits?.hits ?? [];
  const hasMore = hits.length > pageSize;
  const results = hits
    .slice(0, pageSize)
    .map((hit) => mapHitToPersonResult(hit, personType));

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
  const timeoutMs = config.timeoutMs ?? 5000;

  const indices = personType ? [INDEX_MAP[personType]] : Object.values(INDEX_MAP);
  const indexStr = indices.join(',');

  const sourceFields = personType
    ? DEFAULT_RESULT_FIELDS[personType]
    : [...new Set(Object.values(DEFAULT_RESULT_FIELDS).flat())];

  const body = {
    size: 1,
    _source: sourceFields,
    query: {
      bool: {
        must: [{ term: { [key]: value } }],
      },
    },
  };

  const searchPath = config.elasticsearch.methods.search.replace('{index}', indexStr);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${config.elasticsearch.baseUrl}${searchPath}`,
      {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify(body),
        signal,
      },
      timeoutMs
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new OfflineError(`ES request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) return null;

  const data = (await response.json()) as {
    hits: { hits: Array<Record<string, unknown>>; _index?: string };
  };

  const hits = data.hits?.hits ?? [];
  if (hits.length === 0) return null;

  const hit = hits[0];
  const index = String((hit as Record<string, unknown>)['_index'] ?? '');
  const resolvedType: PersonType =
    index.includes('asir') ? 'asir' :
    index.includes('soher') ? 'soher' :
    'ezrach';

  return mapHitToPersonResult(hit, personType ?? resolvedType);
}
