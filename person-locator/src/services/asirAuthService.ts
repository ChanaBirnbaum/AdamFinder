import { get } from './axiosInstance';
import type { ServiceConfig, PersonType } from '../types';

// ─── Prisoner whitelist (מידור) ───────────────────────────────────────────────

export interface AsirWhitelistResult {
  field: string;
  values: (string | number)[];
}

const ASIR_WHITELIST_FIELD = 'idnt';

/**
 * Fetches the list of specific prisoner IDs the current user is allowed to see (מידור).
 * Injected as a `terms` filter into every Elasticsearch asir query.
 *
 * The server returns a plain array of IDs, e.g. `["123", "456"]`.
 * Returns `null` when not configured or request fails (fail-open — no restriction applied).
 */
export async function fetchAsirWhitelist(params: {
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<AsirWhitelistResult | null> {
  const { config, signal } = params;

  if (!config.asirWhitelist) return null;

  const method = config.asirWhitelist.methods['getWhitelist'] ?? '/whitelist';
  const url = `${config.asirWhitelist.baseUrl}${method}`;

  try {
    const { data } = await get<(string | number)[]>(url, { signal });
    if (!Array.isArray(data) || data.length === 0) return null;
    return { field: ASIR_WHITELIST_FIELD, values: data };
  } catch {
    return null; // fail-open: don't block the search
  }
}

// ─── Permission check (הרשאת איתור) ──────────────────────────────────────────

export interface AsirPermissionResult {
  type: PersonType;
  authorizedIds: (string | number)[];
}

/**
 * Checks which person types the current user is permitted to search, and which object IDs
 * are authorised per type (הרשאת איתור).
 *
 * @param personTypes - Optional list of types to query. Omit to request all types.
 *
 * Returns an array (one entry per type) — may be empty when the server denies all access (403).
 * Returns `null` when the endpoint is not configured or the request fails → fail-open (search ES).
 */
export async function checkAsirPermission(params: {
  config: ServiceConfig;
  signal: AbortSignal;
  personTypes?: PersonType[];
}): Promise<AsirPermissionResult[] | null> {
  const { config, signal, personTypes } = params;

  if (!config.asirPermission) return null;

  const method = config.asirPermission.methods['checkPermission'] ?? '/check';
  const baseUrl = `${config.asirPermission.baseUrl}${method}`;
  const url = personTypes?.length
    ? `${baseUrl}?${personTypes.map(t => `PERSONTYPES=${encodeURIComponent(t)}`).join('&')}`
    : baseUrl;

  try {
    const { data } = await get<AsirPermissionResult[]>(url, { signal });
    if (!Array.isArray(data)) return null;
    return data;
  } catch (err: unknown) {
    if (
      typeof err === 'object' && err !== null &&
      (err as { response?: { status?: number } }).response?.status === 403
    ) {
      return []; // explicit 403 → no permission for any type
    }
    return null; // network error → fail-open
  }
}
