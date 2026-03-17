import type { PersonResult, PersonType, ServiceConfig } from '../types';
/**
 * Fetch persons from the local offline DB service.
 * Only invoked when enableOfflineSearch is true AND ES has thrown OfflineError.
 */
export declare function searchOffline(params: {
    query: string;
    personType?: PersonType;
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<PersonResult[]>;
