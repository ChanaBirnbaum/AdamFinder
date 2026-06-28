/**
 * English→Hebrew keyboard-layout map (standard Hebrew keyboard, physical key position).
 * Not a phonetic transliteration — e.g. 't' (positioned where 'א' sits) maps to 'א', not to a
 * phonetically similar letter.
 */
const KEY_POSITION_MAP: Record<string, string> = {
  q: '/', w: "'", e: 'ק', r: 'ר', t: 'א', y: 'ט', u: 'ו', i: 'ן', o: 'ם', p: 'פ',
  a: 'ש', s: 'ד', d: 'ג', f: 'כ', g: 'ע', h: 'י', j: 'ח', k: 'ל', l: 'ך',
  z: 'ז', x: 'ס', c: 'ב', v: 'ה', b: 'נ', n: 'מ', m: 'צ',
};

const HAS_LATIN_LETTER = /[a-z]/i;

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
export function normalizeQuery(query: string | null | undefined): string {
  if (!query) return '';
  if (!HAS_LATIN_LETTER.test(query)) return query;

  let result = '';
  for (const char of query) {
    const lower = char.toLowerCase();
    result += KEY_POSITION_MAP[lower] ?? char;
  }
  return result;
}
