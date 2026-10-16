import { normalizeCreditText } from './cast-credit.mjs';

export const sourceNameKey = (value) => normalizeCreditText(value).toLowerCase().replace(/\s+/gu, '');
export const sourceTitleKey = (value) => normalizeCreditText(value).toLowerCase()
  .replace(/[『』「」"'“”‘’【】\[\]（）()〈〉<>《》]/gu, '')
  .replace(/[~〜～\-―–—\s・:：/／]/gu, '');
const withoutTrailingYear = (value) => normalizeCreditText(value).replace(/\s*\((?:19|20)\d{2}(?:年(?:公演)?)?\)\s*$/u, '');

export function buildSourceLookup(rows, fields, keyFor) {
  const lookup = new Map();
  for (const row of rows) {
    for (const field of fields) {
      const value = row[field];
      for (const text of [value, ...(keyFor === sourceTitleKey ? [withoutTrailingYear(value)] : [])]) {
        const key = keyFor(text);
        if (!key) continue;
        const matches = lookup.get(key) ?? new Map();
        matches.set(row.id, row);
        lookup.set(key, matches);
      }
    }
  }
  return lookup;
}

export function resolveSourceMatch(lookup, values, keyFor) {
  const matches = new Map();
  for (const value of values) {
    const key = keyFor(value);
    for (const [id, row] of lookup.get(key) ?? []) matches.set(id, row);
  }
  const candidates = [...matches.values()];
  return { status: candidates.length === 1 ? 'matched' : candidates.length ? 'ambiguous' : 'unmatched', match: candidates.length === 1 ? candidates[0] : null, candidates };
}

export function resolveSourceActor(lookup, actor) {
  const names = [actor.sourceActorName, actor.aliasFrom, actor.aliasTo].filter(Boolean);
  const named = resolveSourceMatch(lookup, names, sourceNameKey);
  // A kana/slug match is only a candidate. Verify against actual names, not a homophone.
  const namedCandidates = named.candidates.filter((row) => names.some((name) => [row.name, row.name_en].some((candidate) => candidate && sourceNameKey(candidate) === sourceNameKey(name))));
  if (namedCandidates.length) return { status: namedCandidates.length === 1 ? 'matched' : 'ambiguous', match: namedCandidates.length === 1 ? namedCandidates[0] : null, candidates: namedCandidates };
  let slug = '';
  try { slug = new URL(actor.sourceActorUrl).pathname.replace(/^\/|\/$/gu, ''); } catch { /* no source URL */ }
  const loose = resolveSourceMatch(lookup, [...names, slug], sourceNameKey);
  return { status: loose.candidates.length ? 'needs_review' : 'unmatched', match: null, candidates: loose.candidates };
}

export function resolveSourcePlay(lookup, credit) {
  const title = credit.sourceWorkTitle;
  const values = [title, withoutTrailingYear(title)];
  const result = resolveSourceMatch(lookup, values, sourceTitleKey);
  const year = credit.sourceYear;
  const candidates = result.candidates.filter((play) => {
    // A missing year cannot establish a temporal match; an explicit conflict blocks it.
    const years = [...normalizeCreditText(play.period).matchAll(/(?:19|20)\d{2}/gu)].map((m) => Number(m[0]));
    return !year || !years.length || years.includes(year);
  });
  return { status: candidates.length === 1 ? 'matched' : candidates.length ? 'ambiguous' : 'unmatched', match: candidates.length === 1 ? candidates[0] : null, candidates };
}

// Offset advances by rows actually returned, even when the server caps a page.
export async function readAllRows(supabase, table, columns, { offset = 0, limit = Infinity, pageSize = 500, configure = (q) => q } = {}) {
  if (!Number.isInteger(pageSize) || pageSize <= 0 || !Number.isInteger(offset) || offset < 0 || !(limit === Infinity || Number.isInteger(limit) && limit >= 0)) {
    throw new Error('Pagination requires a positive page size and non-negative integer offset/limit.');
  }
  const rows = [];
  while (rows.length < limit) {
    const size = Math.min(pageSize, limit - rows.length);
    const start = offset + rows.length;
    const { data, error } = await configure(supabase.from(table).select(columns)).order('id', { ascending: true }).range(start, start + size - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
  }
  return rows;
}
