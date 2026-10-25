import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'stage-directory-'));
const file = join(dir, 'directory-pages.cjs');
const source = await readFile(new URL('../lib/directory-pages.ts', import.meta.url), 'utf8');
await writeFile(file, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
const { readDirectoryPages } = createRequire(import.meta.url)(file);
after(async () => { await unlink(file); await rmdir(dir); });

test('actors beyond the API row limit remain available to name search and female filters', async () => {
  const actors = Array.from({ length: 1146 }, (_, i) => ({ id: i, name: `actor ${i}`, gender: null }));
  actors[1100] = { id: 1100, name: '長尾 寧音', gender: 'female' };
  const pages = [];
  const result = await readDirectoryPages(async (from, to) => {
    pages.push([from, to]);
    return { data: actors.slice(from, to + 1), error: null };
  });
  assert.deepEqual(result, actors);
  assert.deepEqual(pages.map(p => p[0]), [0, 500, 1000, 1146]);
  assert.equal(result.filter(a => a.gender === 'female' && a.name.replaceAll(' ', '') === '長尾寧音').length, 1);
});

test('a server page cap below the requested range does not truncate or skip actors', async () => {
  const actors = Array.from({ length: 1201 }, (_, i) => ({ id: i }));
  assert.deepEqual(await readDirectoryPages(async (from) => ({ data: actors.slice(from, from + 200), error: null })), actors);
});

test('later page failures reject the list instead of returning a partial directory', async () => {
  const error = new Error('page unavailable');
  await assert.rejects(readDirectoryPages(async (from) => from === 0
    ? { data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null }
    : { data: null, error }), error);
});

test('an empty directory finishes after a single read', async () => {
  let reads = 0;
  assert.deepEqual(await readDirectoryPages(async () => { reads++; return { data: [], error: null }; }), []);
  assert.equal(reads, 1);
});
