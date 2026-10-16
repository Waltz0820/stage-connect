import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputFlag = process.argv.find((arg) => arg.startsWith('--output-dir='));
if (!outputFlag) throw new Error('Use --output-dir=<private snapshot directory>');
const outputDir = resolve(outputFlag.slice('--output-dir='.length));
const env = { ...process.env };
for (const rawLine of (await readFile(join(appDir, '.env.local'), 'utf8')).split(/\r?\n/)) {
  const match = rawLine.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !key) throw new Error('Supabase server credentials are required; values are never logged.');
const headers = { apikey: key, Authorization: `Bearer ${key}` };
async function request(path, accept = 'application/json') {
  const response = await fetch(new URL(`/rest/v1/${path}`, baseUrl), {
    headers: { ...headers, Accept: accept, Prefer: 'count=exact' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Read failed (${response.status}): ${error.code ?? ''} ${error.message ?? ''}`);
  }
  return { rows: await response.json(), range: response.headers.get('content-range') };
}

await mkdir(outputDir, { recursive: true });
const tables = ['actors', 'plays', 'franchises', 'casts'];
const api = (await request('', 'application/openapi+json')).rows;
const schema = Object.fromEntries(tables.map((name) => [name, api.definitions?.[name] ?? null]));
await writeFile(join(outputDir, 'schema.json'), JSON.stringify(schema, null, 2));
const data = {};
const manifest = { capturedAt: new Date().toISOString(), mode: 'read-only', scope: tables, tables: {} };
await Promise.all(tables.map(async (table) => {
  const rows = [];
  let expected = null;
  for (let offset = 0; ; offset = rows.length) {
    const page = await request(`${table}?select=*&order=id.asc&limit=500&offset=${offset}`);
    const count = Number(page.range?.split('/')[1]);
    if (Number.isFinite(count)) {
      if (expected !== null && expected !== count) throw new Error(`Row count changed during ${table} snapshot.`);
      expected = count;
    }
    if (!Array.isArray(page.rows)) throw new Error(`Expected rows for ${table}`);
    rows.push(...page.rows);
    if (!page.rows.length || (expected !== null && rows.length >= expected)) break;
  }
  if (expected !== null && expected !== rows.length) throw new Error(`Incomplete snapshot: ${table}`);
  const json = JSON.stringify(rows, null, 2);
  const ids = new Set(rows.map((r) => r.id));
  if (ids.size !== rows.length) throw new Error(`Duplicate IDs in ${table} snapshot.`);
  await writeFile(join(outputDir, `${table}.json`), json);
  manifest.tables[table] = { count: rows.length, sha256: createHash('sha256').update(json).digest('hex') };
  data[table] = rows;
}));
await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const histogram = (values) => [...values.reduce((map, value) => map.set(value ?? '(null)', (map.get(value ?? '(null)') ?? 0) + 1), new Map())]
  .sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
const actors = new Map(data.actors.map((a) => [a.id, a]));
const plays = new Map(data.plays.map((p) => [p.id, p]));
const series = data.franchises.filter((s) => /tennimu|tenimyu|touken|テニス|刀剣/.test(`${s.slug} ${s.name}`));
const selected = series.map((s) => {
  const seriesPlays = data.plays.filter((p) => p.franchise_id === s.id);
  const ids = new Set(seriesPlays.map((p) => p.id));
  const casts = data.casts.filter((c) => ids.has(c.play_id));
  return {
    slug: s.slug, name: s.name, playCount: seriesPlays.length, castRows: casts.length,
    actorCount: new Set(casts.map((c) => c.actor_id)).size,
    missingRoles: casts.filter((c) => !c.role_name?.trim()).length,
    groups: histogram(casts.map((c) => c.cast_group)),
    annotatedRoles: histogram(casts.filter((c) => /※|【|[（(]|公演|ゲスト|声|映像|アンサンブル/.test(c.role_name ?? '')).map((c) => c.role_name)),
    annotatedExamples: casts.filter((c) => /公演|ゲスト|サポート|※|【/.test(`${c.role_name ?? ''} ${c.cast_group ?? ''}`)).slice(0, 20).map((c) => ({
      actor: actors.get(c.actor_id)?.name, play: plays.get(c.play_id)?.title, role: c.role_name, group: c.cast_group,
    })),
  };
});
const noCast = data.franchises.map((s) => {
  const ps = data.plays.filter((p) => p.franchise_id === s.id);
  return { slug: s.slug, name: s.name, plays: ps.map((p) => ({ slug: p.slug, title: p.title, period: p.period, casts: data.casts.filter((c) => c.play_id === p.id).length })) };
}).filter((s) => s.plays.some((p) => p.casts === 0));
const report = {
  capturedAt: manifest.capturedAt,
  counts: Object.fromEntries(tables.map((name) => [name, data[name].length])),
  schemaColumns: Object.fromEntries(Object.entries(schema).map(([name, def]) => [name, Object.keys(def?.properties ?? {})])),
  notes: ['Read-only public data snapshot; not a complete database backup. RLS, functions, other tables and deployment settings are not captured.'],
  selectedSeries: selected, allGroups: histogram(data.casts.map((c) => c.cast_group)),
  candidateSeries: noCast.filter((s) => /BLEACH|ブリーチ|黒執事|ハイキュー|ペダル|忍たま|薄桜鬼/.test(s.name)).slice(0, 12),
};
await writeFile(join(outputDir, 'audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ snapshotDir: outputDir, counts: report.counts, schemaColumns: report.schemaColumns, selectedSeries: selected.map(({ annotatedExamples, groups, annotatedRoles, ...s }) => ({ ...s, groupVariants: groups.length, annotatedRoleVariants: annotatedRoles.length })), candidateSeries: report.candidateSeries }, null, 2));
