import type { Filter, PersonResult, PersonType, ServiceConfig } from '../types';
/** Custom error thrown when ES is unreachable or returns 5xx. */
export declare class OfflineError extends Error {
    constructor(message: string);
}
export declare function searchPersons(params: {
    query: string;
    personType: PersonType;
    filters: Filter[];
    additionalSearchFields: string[];
    additionalResultFields: string[];
    offset: number;
    pageSize: number;
    activeOnly?: boolean;
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<{
    results: PersonResult[];
    hasMore: boolean;
}>;
export declare function fetchSinglePerson(params: {
    key: string;
    value: string;
    personType?: PersonType;
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<PersonResult | null>;
