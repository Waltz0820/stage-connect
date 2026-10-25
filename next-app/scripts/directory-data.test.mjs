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

function catalogue(tables, { legacy = false } = {}) {
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
      then(resolve, reject) {
        queries.push({ ...state });
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
