/**
 * Converts a query left typed on an English keyboard layout into the Hebrew it was meant to
 * produce, mapping by physical key position rather than phonetics (e.g. "sbh" -> "דני").
 *
 * Search in this system is Hebrew-only, but users sometimes leave their OS keyboard on English
 * and type the Hebrew word anyway. This must run once, on the raw query, before it fans out to
 * any search source (Elasticsearch, DB, etc.) — normalizing inside an individual source's query
 * builder would duplicate the logic and risk the sources disagreeing on what was searched for.
 *
 * Non-Latin characters (digits, spaces, hyphens, Hebrew letters already) pass through unchanged.
 */
export declare function normalizeQuery(query: string | null | undefined): string;
