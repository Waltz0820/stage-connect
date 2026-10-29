import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const compile = async (path) => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleSource = await compile('../lib/stage-connect.ts');
const pagingSource = await compile('../lib/directory-pages.ts');
const paging = { exports: {} };
vm.runInNewContext(pagingSource, { module: paging, exports: paging.exports });

function catalogue(tables, { legacy = false, beforeQuery = async () => {} } = {}) {
  const queries = [];
  const client = { from(table) {
    const state = { table, columns: '', filters: [], orders: [], from: 0, to: 999 };
    const query = {
      select(columns) { state.columns = columns; return query; },
      in(column, values) {
        assert.ok(values.length <= 50, 'catalogue filters must be split into bounded requests');
        state.filters.push([column, values]); return query;
      },
      order(column, options) { state.orders.push([column, options]); return query; },
      range(from, to) { state.from = from; state.to = to; return query; },
      async then(resolve, reject) {
        queries.push({ ...state });
        await beforeQuery(state);
        if (legacy && /name_en/.test(state.columns)) return Promise.resolve({ data: null, error: { message: 'column name_en does not exist' } }).then(resolve, reject);
        let data = [...tables[table]];
        for (const [column, values] of state.filters) data = data.filter(r => values.includes(r[column]));
        data.sort((a, b) => {
          for (const [column, options] of state.orders) {
            const av = a[column], bv = b[column];
            if (av === bv) continue;
            const compare = av == null ? (options?.nullsFirst === false ? 1 : -1) : bv == null ? (options?.nullsFirst === false ? -1 : 1) : av < bv ? -1 : 1;
            return options?.ascending === false ? -compare : compare;
          }
          return 0;
        });
        return Promise.resolve({ data: data.slice(state.from, Math.min(state.to + 1, state.from + 1000)), error: null }).then(resolve, reject);
      },
    };
    return query;
  } };
  const exports = {};
  const dependencies = {
    './performance-period': { performanceStartSortKey: () => 0 },
    './streaming-links': { normalizeVod: value => value },
    './env': { hasSupabaseEnv: true },
    './en-copy': { getEnglishActorName: a => a.nameEn || a.name },
    './supabase': { createSupabaseServerClient: () => client },
    './search-query': {},
    './directory-pages': paging.exports,
  };
  vm.runInNewContext(moduleSource, { exports, module: { exports }, require: key => {
    assert.ok(key in dependencies, key); return dependencies[key];
  }, process: { env: {} } });
  return { ...exports, queries };
}

test('the production actor directory fetches all 1146 actors including women after row 1000', async () => {
  const actors = Array.from({ length: 1146 }, (_, id) => ({ id, slug: `actor-${id}`, name: String(id).padStart(4, '0'), gender: id === 1100 ? 'female' : null }));
  const api = catalogue({ actors });
  const result = await api.getActorList();
  assert.equal(result.length, 1146);
  assert.equal(result.find(a => a.slug === 'actor-1100').gender, 'female');
  assert.ok(api.queries.every(q => q.orders.map(o => o[0]).join(',') === 'name,id'));
});

test('the legacy actor projection remains paginated and retains female classification', async () => {
  const actors = Array.from({ length: 1101 }, (_, id) => ({ id, slug: `actor-${id}`, name: `actor ${id}`, gender: id === 1100 ? 'female' : null }));
  const result = await catalogue({ actors }, { legacy: true }).getActorList();
  assert.equal(result.length, 1101);
  assert.equal(result.find(a => a.slug === 'actor-1100').gender, 'female');
  assert.equal(result[0].nameEn, null);
});

function productions(count) {
  const plays = Array.from({ length: count }, (_, id) => ({ id: `play-${id}`, slug: `work-${id}-` + 'long-title-'.repeat(20), title: `Work ${id}`, title_en: `Work ${id}`, period: '2026年', created_at: '2026-01-01T00:00:00Z' }));
  const casts = plays.map((p, id) => ({ id: `cast-${id}`, play_id: p.id, billing_order: 6000, created_at: '2026-01-01', actor: { slug: `performer-${id}`, name: `俳優 ${id}`, name_en: `Performer ${id}` } }));
  for (let i = 0; i < 1300; i++) casts.push({ id: `bulk-${i}`, play_id: plays[0].id, billing_order: i, created_at: '2026-01-01', actor: { slug: `extra-${i}`, name: `追加 ${i}`, name_en: `Extra ${i}` } });
  return { plays, casts };
}

test('402 works use bounded cast filters and retain summaries beyond 1000 cast rows', async () => {
  const tables = productions(402), api = catalogue(tables);
  const result = await api.getPlayList();
  assert.equal(result.length, 402);
  assert.equal(result.find(p => p.slug === tables.plays[1].slug).mainCastSummary, '俳優 1');
  assert.equal(result.find(p => p.slug === tables.plays[401].slug).mainCastSummaryEn, 'Performer 401');
});

test('long work-slug lookups and legacy cast projections retain every requested summary', async () => {
  const tables = productions(60), api = catalogue(tables, { legacy: true });
  const result = await api.getPlayMainCastSummariesBySlug(tables.plays.map(p => p.slug));
  assert.equal(Object.keys(result).length, 60);
  assert.equal(result[tables.plays[1].slug].ja, '俳優 1');
  assert.equal(result[tables.plays[59].slug].en, '俳優 59');
});

test('directory projection omits profiles while retaining names, dates and female actors beyond row 1000', async () => {
  const tables = { actors: Array.from({ length: 1101 }, (_, id) => ({ id, slug: `actor-${id}`, name: `${id}`, name_en: `Actor ${id}`, kana: 'あ', birthday: '1990-01-01', gender: 'female', profile: 'long biography' })) };
  const api = catalogue(tables);
  const lean = await api.getActorList({ includeProfiles: false });
  assert.equal(lean.length, 1101);
  assert.ok(api.queries.every(q => !/profile/.test(q.columns)));
  const full = await catalogue(tables).getActorList();
  const omitProfiles = rows => rows.map(({ profile, profileEn, ...rest }) => rest);
  assert.deepEqual(omitProfiles(lean), omitProfiles(full));
  const legacy = catalogue(tables, { legacy: true });
  assert.equal((await legacy.getActorList({ includeProfiles: false })).length, 1101);
  assert.ok(legacy.queries.every(q => !/profile/.test(q.columns)));
});

test('work directory reads casts only for visible works and preserves the original summaries', async () => {
  const tables = productions(402);
  tables.casts.push({ id: 'lead-duplicate', play_id: 'play-1', billing_order: null, is_starring: true, actor: { slug: 'performer-1', name: '俳優 1', name_en: 'Performer 1' } });
  const original = await catalogue(tables).getPlayList();
  const api = catalogue(tables);
  const lean = await api.getPlayList({ includeCast: false });
  assert.equal(api.queries.filter(q => q.table === 'casts').length, 0);
  assert.equal(lean.length, original.length);
  const omitSummaries = rows => rows.map(({ mainCastSummary, mainCastSummaryEn, ...rest }) => rest);
  assert.deepEqual(omitSummaries(lean), omitSummaries(original));
  const visible = tables.plays.slice(0, 10).map(p => p.slug);
  const summaries = await api.getPlayMainCastSummariesBySlug(visible);
  for (const slug of visible) {
    const full = original.find(p => p.slug === slug);
    assert.equal(summaries[slug].ja, full.mainCastSummary);
    assert.equal(summaries[slug].en, full.mainCastSummaryEn);
  }
  assert.ok(api.queries.filter(q => q.table === 'casts').every(q => q.filters[0][1].length === 10));
});

test('series reads overlap and retain counts and bilingual metadata, including legacy fallback', async () => {
  let release;
  const started = new Set();
  const barrier = new Promise(resolve => { release = resolve; });
  const tables = { plays: [{ id: 'p', franchise_id: 'f', created_at: '2026-01-01' }], franchises: [{ id: 'f', slug: 'series', name: 'シリーズ', name_en: 'Series', description: '概要', format: 'musical' }] };
  const api = catalogue(tables, { beforeQuery: async ({ table }) => {
    started.add(table);
    if (started.size === 2) release();
    await barrier;
  } });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; release(); }, 500);
  const result = await api.getSeriesList();
  clearTimeout(timeout);
  assert.equal(timedOut, false, 'independent reads must start before either finishes');
  assert.equal(started.size, 2);
  assert.equal(result[0].playCount, 1);
  assert.equal(result[0].nameEn, 'Series');
  const legacy = await catalogue(tables, { legacy: true }).getSeriesList();
  assert.equal(legacy[0].playCount, 1);
  assert.equal(legacy[0].nameEn, null);
});
