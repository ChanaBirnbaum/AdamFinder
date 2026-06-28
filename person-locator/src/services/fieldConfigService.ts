import { get } from './axiosInstance';
import type { PersonType, ServiceConfig } from '../types';

/** Search/source fields for one `PersonType`, as returned by the remote field config endpoint. */
export interface RemoteFieldConfig {
  searchFields: string[];
  sourceFields: string[];
}

export type FieldConfigResponse = Partial<Record<PersonType, RemoteFieldConfig>>;

/**
 * Fetches per-type `searchFields`/`sourceFields` from the server (`ServiceConfig.fieldConfig`).
 * Lets data owners add/remove indexed fields without a client deploy.
 *
 * Returns `null` when not configured or the request fails — fail-open, callers keep using
 * `querySettings`/`DEFAULT_QUERY_SETTINGS` as-is.
 */
export async function fetchFieldConfig(params: {
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<FieldConfigResponse | null> {
  const { config, signal } = params;

  if (!config.fieldConfig) return null;

  const method = config.fieldConfig.methods['getFieldConfig'] ?? '/fields';
  const url = `${config.fieldConfig.baseUrl}${method}`;

  try {
    const { data } = await get<FieldConfigResponse>(url, { signal });
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null; // fail-open: don't block the search
  }
}
