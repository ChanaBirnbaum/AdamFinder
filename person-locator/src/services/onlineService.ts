import { get } from './axiosInstance';
import type { PersonResult, PersonType, ServiceConfig } from '../types';

/**
 * Fetch persons from the online DB service.
 * On any failure, returns [] silently so ES results still display.
 */
export async function fetchOnlinePersons(params: {
  query: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult[]> {
  const { query, personType, config, signal } = params;

  try {
    const url = new URL(`${config.online.baseUrl}${config.online.methods.search}`);
    url.searchParams.set('q', query);
    if (personType) url.searchParams.set('type', personType);

    const response = await get<{ results?: Record<string, unknown>[] }>(
      url.toString(),
      { signal },
    );

    return (response.data.results ?? []).map((p) => ({
      id: String(p['id'] ?? ''),
      personType: (p['personType'] as PersonType) ?? 'ezrach',
      isActive: Boolean(p['isActive'] ?? true),
      source: 'online' as const,
      data: { ...p },
    }));
  } catch {
    return [];
  }
}
