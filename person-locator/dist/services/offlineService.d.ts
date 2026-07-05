import type { PersonResult, PersonType, ServiceConfig } from '../types';
/**
 * Fetch persons from the local offline DB service.
 * Invoked whenever an ES search for a given person type fails (any error, not just OfflineError).
 * Only matches by exact numeric identifier — free-text queries return no results.
 */
export declare function searchOffline(params: {
    query: string;
    personType?: PersonType;
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<PersonResult[]>;
