import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { analyzeCastCredit, castCreditKey } from '../lib/cast-credit.mjs';

const input = process.argv.find((arg) => arg.startsWith('--snapshot-dir='));
if (!input) throw new Error('Use --snapshot-dir=<audit snapshot directory>');
const dir = resolve(input.slice('--snapshot-dir='.length));
const [casts, plays, franchises, actors] = await Promise.all(['casts', 'plays', 'franchises', 'actors'].map(async (name) => JSON.parse(await readFile(join(dir, `${name}.json`), 'utf8'))));
const seriesById = new Map(franchises.map((s) => [s.id, s]));
const playById = new Map(plays.map((p) => [p.id, p]));
const actorById = new Map(actors.map((a) => [a.id, a]));
const rows = casts.map((c) => ({
  id: c.id, actor: actorById.get(c.actor_id)?.name, playSlug: playById.get(c.play_id)?.slug,
  series: seriesById.get(playById.get(c.play_id)?.franchise_id)?.slug ?? null,
  parsed: analyzeCastCredit(c),
}));
const groups = new Map();
for (const c of casts) {
  const key = `${c.actor_id}:${c.play_id}:${castCreditKey(c)}`;
  groups.set(key, [...(groups.get(key) ?? []), c.id]);
}
const summary = { mode: 'preview-only; no DB writes', rows: rows.length,
  annotated: rows.filter((r) => r.parsed.annotations.length).length,
  needsReview: rows.filter((r) => r.parsed.needsReview).length,
  qualityIssues: rows.filter((r) => r.parsed.qualityFlags.length).length,
  similarCreditGroups: [...groups.values()].filter((ids) => ids.length > 1),
  series: ['tennimu', 'butai-touken-ranbu', 'touken-ranbu-musical'].map((slug) => {
    const credits = rows.filter((r) => r.series === slug);
    return { slug, rows: credits.length, annotated: credits.filter((r) => r.parsed.annotations.length).length,
      needsReview: credits.filter((r) => r.parsed.needsReview).length,
      unresolvedExamples: credits.filter((r) => r.parsed.needsReview).map((r) => ({ actor: r.actor, playSlug: r.playSlug, role: r.parsed.raw.roleName, group: r.parsed.raw.castGroup, unresolved: r.parsed.unresolved.map((n) => n.text), qualityFlags: r.parsed.qualityFlags })),
    };
  }),
};
await writeFile(join(dir, 'cast-normalization-preview.json'), JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2));
