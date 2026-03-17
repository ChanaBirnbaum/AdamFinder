import type { PersonResult } from '../types';

/**
 * Merge ES results and online/DB results, deduplicating by person.id.
 * Online results take priority over ES on duplicate ID.
 * Final order: online results first, then ES-only results.
 */
export function mergeResults(
  esResults: PersonResult[],
  onlineResults: PersonResult[]
): PersonResult[] {
  const onlineIds = new Set(onlineResults.map((p) => p.id));
  const esOnly = esResults.filter((p) => !onlineIds.has(p.id));
  return [...onlineResults, ...esOnly];
}
