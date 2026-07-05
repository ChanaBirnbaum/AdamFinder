import type { ServiceConfig, PersonType } from '../types';
export interface AsirWhitelistResult {
    field: string;
    values: (string | number)[];
}
/**
 * Fetches the list of specific prisoner IDs the current user is allowed to see (מידור).
 * Injected as a `terms` filter into every Elasticsearch asir query.
 *
 * The server returns a plain array of IDs, e.g. `["123", "456"]`.
 * Returns `null` when not configured or request fails (fail-open — no restriction applied).
 */
export declare function fetchAsirWhitelist(params: {
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<AsirWhitelistResult | null>;
export interface PersonPermissionResult {
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
export declare function checkPersonPermission(params: {
    config: ServiceConfig;
    signal: AbortSignal;
    personTypes?: PersonType[];
}): Promise<PersonPermissionResult[] | null>;
