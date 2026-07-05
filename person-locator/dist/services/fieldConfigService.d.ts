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
export declare function fetchFieldConfig(params: {
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<FieldConfigResponse | null>;
