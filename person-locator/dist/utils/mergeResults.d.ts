import type { PersonResult } from '../types';
/**
 * Merge ES results and online/DB results, deduplicating by person.id.
 * Online results take priority over ES on duplicate ID.
 * Final order: online results first, then ES-only results.
 */
export declare function mergeResults(esResults: PersonResult[], onlineResults: PersonResult[]): PersonResult[];
