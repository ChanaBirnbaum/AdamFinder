/** The raw ES field holding the description blob (Hebrew headers + values). */
export const DESCRIPTION_FIELD = 'description';

/**
 * Parses the description blob into flat key→value entries.
 *
 * The blob is JSON-like but NOT valid JSON — unquoted Hebrew keys and values,
 * e.g. `{שיבוץ:11111, אזור:4444, סטטוס:פעיל, תא:455}` — so it is parsed by
 * hand: strip braces, split on commas, split each segment on its first colon.
 * Malformed segments are skipped rather than failing the whole hit.
 */
export function parseDescriptionEntries(raw: unknown): Record<string, string> {
  if (raw == null) return {};

  // Defensive: if the index ever returns it as a real object, use it as-is.
  if (typeof raw === 'object') {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k.trim(), String(v).trim()]),
    );
  }

  if (typeof raw !== 'string') return {};

  const entries: Record<string, string> = {};
  for (const segment of raw.replace(/[{}]/g, '').split(',')) {
    const idx = segment.indexOf(':');
    if (idx <= 0) continue;
    const key = segment.slice(0, idx).trim();
    const value = segment.slice(idx + 1).trim();
    if (key && value) entries[key] = value;
  }
  return entries;
}
