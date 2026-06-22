import { get } from './axiosInstance';
import type { PersonResult, PersonType, ServiceConfig } from '../types';

/** Offline search only supports exact identifier lookup — ID length varies by person type, but it's always numeric. */
const ID_PATTERN = /^\d+$/;

/**
 * Fetch persons from the local offline DB service.
 * Invoked whenever an ES search for a given person type fails (any error, not just OfflineError).
 * Only matches by exact numeric identifier — free-text queries return no results.
 */
export async function searchOffline(params: {
  query: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult[]> {
  const { query, personType, config, signal } = params;

  if (!ID_PATTERN.test(query.trim())) return [];

  const url = new URL(`${config.offline.baseUrl}${config.offline.methods.search}`);
  url.searchParams.set('q', query);
  if (personType) url.searchParams.set('type', personType);

  const response = await get<{ results?: Record<string, unknown>[] }>(
    url.toString(),
    { signal },
  );

  return (response.data.results ?? []).map((p) => {
    // Offline results never show a photo, regardless of what the backend returns.
    const { photoUrl: _photoUrl, ...data } = p;
    return {
      id: String(p['id'] ?? ''),
      personType: personType ?? (p['personType'] as PersonType) ?? 'ezrach',
      isActive: Boolean(p['isActive'] ?? true),
      source: 'offline' as const,
      data,
    };
  });
}
