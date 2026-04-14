import axios from 'axios';
import type { PersonResult, PersonType, ServiceConfig } from '../types';

function buildHeaders(config: ServiceConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
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

  const source = axios.CancelToken.source();
  signal.addEventListener('abort', () => source.cancel('AbortError'));

  const url = new URL(`${config.offline.baseUrl}${config.offline.methods.search}`);
  url.searchParams.set('q', query);
  if (personType) url.searchParams.set('type', personType);

  const response = await axios.get<{ results?: Record<string, unknown>[] }>(
    url.toString(),
    { headers: buildHeaders(config), cancelToken: source.token },
  );

  return (response.data.results ?? []).map((p) => ({
    id: String(p['id'] ?? ''),
    personType: (p['personType'] as PersonType) ?? 'ezrach',
    isActive: Boolean(p['isActive'] ?? true),
    source: 'offline' as const,
    data: { ...p },
  }));
}
