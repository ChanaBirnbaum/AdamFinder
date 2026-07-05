import type { PersonResult, ServiceConfig } from '../types';
export declare function enrichPersonsWithPhotoUrls(params: {
    persons: PersonResult[];
    config: ServiceConfig;
    signal: AbortSignal;
}): Promise<PersonResult[]>;
