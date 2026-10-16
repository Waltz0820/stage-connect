export const SEARCH_QUERY_LIMIT = 200;

const normalizeText = (value: string) => value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
export const normalizeSearchQuery = (value: string) => normalizeText(value).slice(0, SEARCH_QUERY_LIMIT);

// Search normalization is for discovery only; it never changes stored names or identity matching.
export function searchKey(value: string) {
  return normalizeText(value).toLowerCase()
    .replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\s\u3000-]/g, '');
}

export function matchesSearch(values: Array<string | null | undefined>, query: string) {
  const needle = searchKey(query);
  return !needle || values.some(value => searchKey(value ?? '').includes(needle));
}

// PostgREST .or() takes raw grammar. Quote values independently of URL encoding.
// Escape SQL LIKE metacharacters before escaping quotes/backslashes for that grammar.
export function buildSearchFilter(columns: readonly string[], query: string) {
  const q = normalizeSearchQuery(query);
  if (!q) return '';
  const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');
  const quote = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const compact = q.replace(/\s/g, '');
  const patterns = new Set([`%${escapeLike(q)}%`, `%${[...compact].map(escapeLike).join('%')}%`]);
  // Kana is commonly entered in either script. Try both while preserving the original.
  const hira = q.replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
  const kata = q.replace(/[ぁ-ゖ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60));
  for (const variant of [hira, kata]) {
    if (variant !== q) patterns.add(`%${[...variant.replace(/\s/g, '')].map(escapeLike).join('%')}%`);
  }
  return columns.flatMap(column => [...patterns].map(pattern => `${column}.ilike.${quote(pattern)}`)).join(',');
}
