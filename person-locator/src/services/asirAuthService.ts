import { get } from './axiosInstance';
import type { ServiceConfig } from '../types';

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

/**
 * Checks whether the current user has any permission to search prisoners at all (הרשאת איתור).
 *
 * The server should return HTTP 200 with any truthy body when permitted,
 * or HTTP 403 / falsy body when not permitted.
 *
 * Returns `true`  — user has permission → search ES normally.
 * Returns `false` — user has no permission → fall back to offline.
 * Returns `null`  — endpoint not configured or request failed → fail-open (search ES).
 */
export async function checkAsirPermission(params: {
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<boolean | null> {
  const { config, signal } = params;

  if (!config.asirPermission) return null;

  const method = config.asirPermission.methods['checkPermission'] ?? '/check';
  const url = `${config.asirPermission.baseUrl}${method}`;

  try {
    await get(url, { signal });
    return true; // 2xx → has permission
  } catch (err: unknown) {
    if (
      typeof err === 'object' && err !== null &&
      (err as { response?: { status?: number } }).response?.status === 403
    ) {
      return false; // explicit 403 → no permission
    }
    return null; // network error → fail-open
  }
}
