import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { createCatalogueFetch, refreshDirectory } from '../lib/directory-refresh.mjs';

const compile = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

test('shared public cache reuses bilingual records, normalizes visible cast keys and expires on invalidation', async () => {
  const cache = new Map(), reads = [], definitions = [];
  const api = {};
  vm.runInNewContext(await compile('../lib/directory-cache.ts'), {
    exports: api, module: { exports: api }, require: name => ({
      'server-only': {}, './env': { SUPABASE_URL: 'https://db.example' },
      'next/cache': { unstable_cache: (fn, keys, options) => {
        definitions.push({ keys, options });
        return async (...args) => {
          const key = JSON.stringify([keys, args]);
          if (!cache.has(key)) cache.set(key, await fn(...args));
          return cache.get(key);
        };
      } },
      './stage-connect': Object.fromEntries(['getActorList', 'getPlayList', 'getSeriesList', 'getPlayMainCastSummariesBySlug'].map(name => [name, async (...args) => { reads.push([name, args]); return { ja: '日本語', en: 'English' }; }])),
    })[name],
  });
  await api.getDirectoryActors(); await api.getDirectoryActors();
  await api.getDirectoryPlays(); await api.getDirectoryPlays();
  await api.getDirectorySeries(); await api.getDirectorySeries();
  await api.getDirectoryCastSummaries([' b ', 'a', 'a']);
  await api.getDirectoryCastSummaries(['a', 'b']);
  await api.getDirectoryCastSummaries([]);
  assert.equal(reads.length, 4);
  assert.equal(reads[0][1][0].includeProfiles, false);
  assert.equal(reads[1][1][0].includeCast, false);
  assert.equal(JSON.stringify(reads[3][1]), '[["a","b"]]');
  assert.ok(definitions.every(d => d.options.revalidate === 60 && d.options.tags.includes(api.DIRECTORY_CACHE_TAG)));
  cache.clear(); await api.getDirectoryActors();
  assert.equal(reads.length, 5);
});

test('successful catalogue mutations invalidate without altering the save result; failed writes and unrelated requests do not', async () => {
  let invalidations = 0, mutations = 0;
  const original = new Response(null, { status: 204 });
  const wrapped = createCatalogueFetch('https://db.example', async () => { mutations++; return original; }, async token => {
    assert.equal(token, 'test-token'); invalidations++;
  });
  const headers = { Authorization: 'Bearer test-token' };
  for (const path of ['actors', 'casts', 'plays', 'franchises', 'rpc/accept_external_work_cast_candidate', 'rpc/register_reviewed_work_actor']) {
    assert.equal(await wrapped(`https://db.example/rest/v1/${path}`, { method: 'POST', headers }), original);
  }
  assert.equal(invalidations, 6);
  await wrapped('https://other.example/rest/v1/actors', { method: 'POST', headers });
  await wrapped('https://db.example/rest/v1/actors', { headers });
  await wrapped('https://db.example/rest/v1/rpc/stage_external_work_cast_candidates', { method: 'POST', headers });
  assert.equal(invalidations, 6); assert.equal(mutations, 9);
  const failed = createCatalogueFetch('https://db.example', async () => new Response(null, { status: 403 }), async () => { throw new Error('must not run'); });
  assert.equal((await failed('https://db.example/rest/v1/actors', { method: 'PATCH', headers })).status, 403);
  const unavailable = createCatalogueFetch('https://db.example', async () => original, async () => { throw new Error('unavailable'); });
  assert.equal(await unavailable('https://db.example/rest/v1/casts', { method: 'DELETE', headers }), original);
  await assert.rejects(() => refreshDirectory(undefined));
});

test('cache clear requires server-verified admin identity and rejects cross-site or invalid requests', async () => {
  const source = await compile('../app/api/admin/revalidate-directory/route.ts');
  let clears = 0, authCalls = 0;
  const route = {};
  vm.runInNewContext(source, {
    exports: route, module: { exports: route }, Response, URL,
    process: { env: { ADMIN_EMAILS: 'admin@example.com' } },
    require: name => name === 'next/cache' ? { revalidateTag: () => clears++ } : name.endsWith('directory-cache') ? { DIRECTORY_CACHE_TAG: 'public-directory-v1' } : {
      createSupabaseServerClient: () => ({ auth: { getUser: async token => {
        authCalls++;
        return token === 'invalid' ? { data: { user: null }, error: new Error('invalid') } : { data: { user: { email: token === 'admin' ? 'ADMIN@example.com' : 'reader@example.com', user_metadata: { role: 'admin' } } }, error: null };
      } } }),
    },
  });
  const request = (token, origin) => new Request('https://stageconnect.jp/api/admin/revalidate-directory', {
    method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}) },
  });
  assert.equal((await route.POST(request())).status, 401);
  assert.equal((await route.POST(request('invalid'))).status, 401);
  assert.equal((await route.POST(request('reader'))).status, 403);
  assert.equal((await route.POST(request('admin', 'https://other.example'))).status, 403);
  assert.equal(clears, 0); assert.equal(authCalls, 2);
  const result = await route.POST(request('admin', 'https://stageconnect.jp'));
  assert.equal(result.status, 200); assert.equal(clears, 1);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});
