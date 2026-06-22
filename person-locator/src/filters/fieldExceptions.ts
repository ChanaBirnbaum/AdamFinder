/** Maps an Elasticsearch field path to the differently-shaped path on the synced object (online/offline/PersonResult.data). */
export type FieldExceptionsMap = Record<string, string>;

/**
 * Known mismatches between an Elasticsearch field path and the client-side object path.
 * Empty by default — for most fields the path is identical on both sides (modulo a
 * trailing `.keyword`, which `compileToPredicate` strips automatically). Add an entry
 * here only when a real mismatch is found, e.g. `unitId: 'unit.id'` if Elasticsearch
 * stores `unitId` but the synced object nests it under `unit.id`.
 */
export const defaultFieldExceptions: FieldExceptionsMap = {};
