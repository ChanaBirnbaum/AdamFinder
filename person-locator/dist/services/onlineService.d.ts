import type { PersonResult, PersonType, ServiceConfig } from '../types';
/**
 * Fetch persons from the online DB service.
 * On any failure, returns [] silently so ES results still display.
 */
export declare function fetchOnlinePersons(params: {
    query: string;
    personType?: PersonType;
    /** Prisoner whitelist (מידור) — restricts the online asir search to these IDs. */
    allowedAsirIds?: (string | number)[];
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<PersonResult[]>;
