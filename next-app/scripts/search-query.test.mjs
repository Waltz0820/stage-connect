import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'stage-search-'));
const file = join(dir, 'search-query.js');
const source = await readFile(new URL('../lib/search-query.ts', import.meta.url), 'utf8');
await writeFile(file, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
const { normalizeSearchQuery, matchesSearch, buildSearchFilter } = createRequire(import.meta.url)(file);
after(async () => { await unlink(file); await rmdir(dir); });

test('query bounds handle full width text, whitespace, and control characters', () => {
  assert.equal(normalizeSearchQuery('　Ｓａｔｏ\t Ｒｙｕｊｉ\u0000 '), 'Sato Ryuji');
  assert.equal(normalizeSearchQuery('a'.repeat(300)).length, 200);
  assert.equal(normalizeSearchQuery('　\n '), '');
});
test('catalogue discovery accepts spaced names, romanized slugs, and either kana script', () => {
  assert.ok(matchesSearch(['佐藤 流司','さとう りゅうじ','sato-ryuji'], 'サトウリュウジ'));
  assert.ok(matchesSearch(['佐藤 流司','sato-ryuji'], 'ＳＡＴＯ　ＲＹＵＪＩ'));
  assert.ok(!matchesSearch(['佐藤 流司','sato-ryuji'], '鈴木'));
  assert.ok(matchesSearch([null,undefined], ''));
});
test('filters quote grammar delimiters and escape literal SQL LIKE characters', () => {
  assert.equal(buildSearchFilter(['name'], ''), '');
  assert.equal(buildSearchFilter(['name'], 'a,b'), 'name.ilike."%a,b%",name.ilike."%a%,%b%"');
  const filter = buildSearchFilter(['title'], 'x),name.neq.foo');
  assert.ok(filter.startsWith('title.ilike."%x),name.neq.foo%"'));
  assert.ok(buildSearchFilter(['name'], '"').includes('\\"'));
  assert.ok(buildSearchFilter(['name'], '%').includes('\\\\%'));
  assert.ok(buildSearchFilter(['name'], '_').includes('\\\\_'));
  assert.ok(buildSearchFilter(['name'], '\\').includes('\\\\\\\\'));
});
test('kana variants keep long vowel marks and each character in supplementary Unicode intact', () => {
  const filter = buildSearchFilter(['kana'], 'サトウ');
  assert.ok(filter.includes('さ%と%う'));
  assert.ok(buildSearchFilter(['title'], '𠮷野').includes('𠮷%野'));
  assert.ok(matchesSearch(['ミュージカル'], 'みゅーじかる'));
});
