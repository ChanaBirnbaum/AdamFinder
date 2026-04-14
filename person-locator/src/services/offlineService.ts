import type { PersonResult, PersonType, ServiceConfig } from '../types';

function buildHeaders(config: ServiceConfig): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (config.authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${config.authToken}`;
  }
  return headers;
}

/**
 * Fetch persons from the local offline DB service.
 * Only invoked when enableOfflineSearch is true AND ES has thrown OfflineError.
 */
export async function searchOffline(params: {
  query: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult[]> {
  const { query, personType, config, signal } = params;

  const url = new URL(`${config.offline.baseUrl}${config.offline.methods.search}`);
  url.searchParams.set('q', query);
  if (personType) url.searchParams.set('type', personType);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(config),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Offline service error: ${response.status}`);
  }

  const data = (await response.json()) as { results?: Record<string, unknown>[] };
  return (data.results ?? []).map((p) => ({
    id: String(p['id'] ?? ''),
    personType: (p['personType'] as PersonType) ?? 'ezrach',
    isActive: Boolean(p['isActive'] ?? true),
    source: 'offline' as const,
    data: { ...p },
  }));
}
