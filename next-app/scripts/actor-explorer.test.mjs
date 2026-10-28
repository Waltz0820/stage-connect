import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'stage-actor-explorer-'));
after(async () => { assert.equal(dirname(resolve(dir)), resolve(tmpdir())); assert.ok(basename(dir).startsWith('stage-actor-explorer-')); await rm(dir, { recursive: true, force: true }); });
const require = createRequire(import.meta.url);
for (const module of ['actor-explorer', 'performance-period', 'en-copy', 'en-term-map']) {
  const source = await readFile(new URL(`../lib/${module}.ts`, import.meta.url), 'utf8');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, module + '.js'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const { buildActorExplorer } = require(join(dir, 'actor-explorer.js'));
const credit = (id, overrides = {}) => ({ id, roleName: '役A', castGroup: '春組', note: null, isStarring: false, billingOrder: 1, ...overrides });
const work = (id, period, overrides = {}) => ({ id, slug: 'production-' + id, title: '作品' + id, titleEn: 'Work ' + id, period, summary: null, vod: null, roleName: '役A', credits: [credit(id)], coStars: [], franchiseName: null, franchiseNameEn: null, franchiseSlug: null, ...overrides });

test('zero, one and two works produce real counts with no dummy groups', () => {
  assert.deepEqual(buildActorExplorer([], 'ja'), []);
  const one = buildActorExplorer([work('one', '2026年4月')], 'ja');
  assert.equal(one[0].works.length, 1); assert.equal(one[0].works[0].date, '2026.04');
  assert.equal(buildActorExplorer([work('one', '2026'), work('two', '2026')], 'ja')[0].works.length, 2);
});
test('latest actual data year is first; undated and venue numbers never become years', () => {
  const groups = buildActorExplorer([work('u', 'シアター1010'), work('old', '2017/12/15'), work('future', '2027年5月'), work('bad', '2025/99/99')], 'ja');
  assert.deepEqual(groups.map(g => g.year), ['2027', '2017', 'unknown']);
  assert.equal(groups[2].works.length, 2); assert.equal(groups[2].works[0].date, null);
});
test('partial dates retain precision and never invent month/day from a range or note', () => {
  const [g] = buildActorExplorer([work('range', '2026/11~12月※詳細未定'), work('year', '2026年'), work('full', '2026年4月10日〜5月17日')], 'ja');
  assert.deepEqual(g.works.map(w => [w.id, w.date]), [['range', '2026.11'], ['full', '2026.04.10'], ['year', '2026']]);
});
test('all same-work roles, A/B and voice notes survive; work count remains one', () => {
  const roles = [credit('a', { note: '福岡公演※日替わりゲスト' }), credit('b', { roleName: '役B', castGroup: 'Bキャスト', note: '声の出演', isStarring: true }), credit('c', { roleName: null, note: '追加注記' })];
  const [group] = buildActorExplorer([work('a', '2017', { credits: roles, roleName: '役A / 役B' })], 'ja');
  assert.equal(group.works.length, 1); assert.equal(group.works[0].credits.length, 3);
  assert.deepEqual(group.works[0].credits.map(c => [c.role, c.group, c.note, c.starring]), [['役A', '春組', '福岡公演※日替わりゲスト', false], ['役B', 'Bキャスト', '声の出演', true], [null, '春組', '追加注記', false]]);
});
test('English labels use existing translations and data; no false co-stars/streaming', () => {
  const link = 'https://al.dmm.com/?af_id=stageconnect-001&lurl=test';
  const [group] = buildActorExplorer([work('a', '2026年4月10日〜5月17日', { franchiseName: 'シリーズ', franchiseNameEn: 'Series', franchiseSlug: 'series', vod: { dmm: link }, coStars: [{ slug: 'co-star', name: '共演者', nameEn: 'Co Star' }] })], 'en');
  assert.equal(group.works[0].title, 'Work a'); assert.equal(group.works[0].series.name, 'Series');
  assert.equal(group.works[0].period, '2026/4/10–5/17'); assert.equal(group.works[0].dmm, link);
  assert.deepEqual(group.works[0].coStars, [{ slug: 'co-star', name: 'Co Star' }]);
  const empty = buildActorExplorer([work('b', null)], 'en')[0].works[0];
  assert.equal(empty.dmm, null); assert.deepEqual(empty.coStars, []); assert.equal(empty.series, null);
});
test('many works in one year remain available in order without mutating input', () => {
  const input = Array.from({ length: 45 }, (_, i) => work(String(i), `2026/${i % 12 + 1}/01`));
  const copy = structuredClone(input), groups = buildActorExplorer(input, 'ja');
  assert.equal(groups[0].works.length, 45); assert.deepEqual(input, copy);
  assert.equal(new Set(groups[0].works.map(w => w.id)).size, 45);
});
