import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Compile the pure application helpers with the project's TypeScript version.
// This tests the actual helpers without requiring a running Next server.
const directory = await mkdtemp(join(tmpdir(), 'stage-connect-locale-'));
const modules = ['en-term-map', 'en-copy', 'locale-routing'];
after(async () => {
  for (const name of modules) await unlink(join(directory, `${name}.js`));
  await rmdir(directory);
});
for (const name of modules) {
  const source = await readFile(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  await writeFile(join(directory, `${name}.js`), outputText);
}
const require = createRequire(import.meta.url);
const terms = require(join(directory, 'en-term-map.js'));
const copy = require(join(directory, 'en-copy.js'));
const routing = require(join(directory, 'locale-routing.js'));

test('every existing exact dictionary entry retains its translation', () => {
  assert.equal(Object.keys(terms.EN_EXACT_TERM_MAP).length, 686);
  for (const [source, target] of Object.entries(terms.EN_EXACT_TERM_MAP)) {
    assert.equal(terms.translateExactTermEn(source), target, source);
    assert.equal(terms.translateKnownTermsEn(source), target, source);
  }
});

test('every partial phrase uses its own translation, including overlapping phrases', () => {
  assert.equal(terms.EN_PARTIAL_TERM_MAP.length, 33);
  for (const [source, target] of terms.EN_PARTIAL_TERM_MAP) {
    const expected = Object.hasOwn(terms.EN_EXACT_TERM_MAP, source) ? terms.EN_EXACT_TERM_MAP[source] : target;
    assert.equal(terms.translateKnownTermsEn(source), expected, source);
    assert.equal(terms.translateKnownTermsEn(`前置き ${source} 後書き`), `前置き ${target} 後書き`, source);
  }
});

test('unknown text and object prototype names stay literal', () => {
  for (const text of ['未確認の役名', 'constructor', 'toString', '__proto__']) {
    assert.equal(terms.translateExactTermEn(text), text);
    assert.equal(terms.translateKnownTermsEn(text), text);
  }
  assert.equal(terms.translateKnownTermsEn(null), '');
});

test('explicit database English values keep precedence over fallback rules', () => {
  assert.equal(copy.getEnglishActorName({ name: '佐藤流司', slug: 'sato-ryuji', nameEn: 'Verified Actor' }), 'Verified Actor');
  assert.equal(copy.getEnglishSeriesName({ name: '刀剣乱舞', nameEn: 'Verified Series' }), 'Verified Series');
  assert.equal(copy.getEnglishPlayTitle({ title: '刀剣乱舞', titleEn: 'Verified Production' }), 'Verified Production');
});

test('annotated role display retains multiple roles and unresolved conditions', () => {
  const result = copy.translateAnnotatedDisplayTextEn('役名A / 役名B※福岡公演・日替わりゲスト【声のみ】');
  for (const part of ['役名A', '役名B', '福岡公演', '日替わりゲスト', '声のみ']) assert.ok(result.includes(part), result);
  assert.equal(copy.translateAnnotatedDisplayTextEn('役名※大阪・福岡公演のみ'), '役名 ※Osaka and Fukuoka performances only');
});

test('supported pages have reciprocal Japanese and English routes', () => {
  for (const path of ['/', '/actors', '/actors/sato-ryuji', '/plays', '/plays/test', '/series', '/series/test']) {
    const ja = routing.getLanguageTargets(path);
    const en = routing.getLanguageTargets(ja.enHref);
    assert.equal(ja.locale, 'ja');
    assert.equal(en.locale, 'en');
    assert.equal(ja.enAvailable, true);
    assert.equal(en.enAvailable, true);
    assert.equal(en.jaHref, path);
    assert.equal(en.enHref, ja.enHref);
  }
});

test('locale and admin boundaries do not swallow similarly prefixed paths', () => {
  assert.equal(routing.getLanguageTargets('/en/actors/').jaHref, '/actors');
  assert.equal(routing.getLanguageTargets('/english').locale, 'ja');
  assert.equal(routing.getLanguageTargets('/guide').enAvailable, false);
  assert.equal(routing.getLanguageTargets('/search').enAvailable, true);
  assert.equal(routing.getLanguageTargets('/en/search').jaHref, '/search');
  assert.equal(routing.getLanguageTargets('/watch/dmm').enAvailable, false);
  assert.equal(routing.getLanguageTargets('/actors/a/extra').enAvailable, false);
  assert.equal(routing.isAdminPath('/admin'), true);
  assert.equal(routing.isAdminPath('/admin/actors'), true);
  assert.equal(routing.isAdminPath('/administrator'), false);
});
