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

test('BLEACH series attribution and production company translate through the display pipeline', () => {
  assert.equal(copy.translateDisplayTextEn('久保帯人（集英社「週刊少年ジャンプ」連載）'), "Tite Kubo (serialized in Shueisha's Weekly Shonen Jump)");
  assert.equal(copy.translateDisplayTextEn('ぴえろ'), 'Pierrot');
});

test('every existing exact dictionary entry retains its translation', () => {
  assert.equal(Object.keys(terms.EN_EXACT_TERM_MAP).length, 709);
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

test('opaque actor URLs never become invented English names', () => {
  const id = 'c2245aaf-85e6-46b1-82ab-5256dee56efe';
  for (const slug of [id, `performer-${id}`, `actor-${id}`]) {
    assert.equal(copy.slugToEnglishActorName(slug), '');
    assert.equal(copy.getEnglishActorName({ slug, name: '齋藤久美子' }), '齋藤久美子');
    assert.equal(copy.getEnglishActorName({ slug, name: '齋藤久美子', nameEn: 'Verified Name' }), 'Verified Name');
  }
  assert.equal(copy.getEnglishActorName({ slug: 'sato-ryuji', name: '佐藤流司' }), 'Ryuji Sato');
});

test('annotated role display retains multiple roles and unresolved conditions', () => {
  const result = copy.translateAnnotatedDisplayTextEn('役名A / 役名B※福岡公演・日替わりゲスト【声のみ】');
  for (const part of ['役名A', '役名B', '福岡公演', '日替わりゲスト', '声のみ']) assert.ok(result.includes(part), result);
  assert.equal(copy.translateAnnotatedDisplayTextEn('役名※大阪・福岡公演のみ'), '役名 ※Osaka and Fukuoka performances only');
});

test('reviewed BLEACH role names translate without dropping dual roles or appearance conditions', async () => {
  const reviewed = JSON.parse(await readFile(new URL('../research/bleach-role-translations.json', import.meta.url), 'utf8'));
  assert.equal(reviewed.roles.length, 21);
  for (const role of reviewed.roles) {
    assert.equal(copy.translateAnnotatedDisplayTextEn(role.ja), role.en, role.ja);
    assert.ok(role.jaUrl.startsWith('https://www.bleach-bravesouls.com/character/'));
    assert.ok(role.enUrl.startsWith('https://www.bleach-bravesouls.com/en/character/'));
  }
  assert.equal(copy.translateAnnotatedDisplayTextEn('黒崎一護 / 朽木ルキア※東京公演のみ'),
    'Ichigo Kurosaki / Rukia Kuchiki ※Tokyo performances only');
  assert.equal(copy.translateAnnotatedDisplayTextEn('市丸ギン【声のみ】 / 未確認の役名※日替わりゲスト'),
    'Gin Ichimaru (声のみ) / 未確認の役名 ※Rotating Guest');
});

test('supported pages have reciprocal Japanese and English routes', () => {
  for (const path of ['/', '/actors', '/actors/sato-ryuji', '/plays', '/plays/test', '/series', '/series/test','/watch','/watch/dmm','/watch/u-next','/watch/danime']) {
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
  assert.equal(routing.getLanguageTargets('/watch/unknown').enAvailable, false);
  assert.equal(routing.getLanguageTargets('/actors/a/extra').enAvailable, false);
  assert.equal(routing.isAdminPath('/admin'), true);
  assert.equal(routing.isAdminPath('/admin/actors'), true);
  assert.equal(routing.isAdminPath('/administrator'), false);
});

test('language switches retain catalogue filters and section anchors, without tracking parameters', () => {
  const search = '?q=刀剣&format=stage&point=cast&sort=support&service=dmm&streaming=available&page=2&utm_source=test';
  const en = routing.getLanguageTargets('/plays', search, '#fan-points');
  const url = new URL(en.enHref, 'https://stageconnect.jp');
  assert.equal(url.pathname, '/en/plays');
  for (const key of ['q','format','point','sort','service','streaming','page']) assert.equal(url.searchParams.get(key), new URLSearchParams(search).get(key));
  assert.equal(url.searchParams.has('utm_source'), false);
  assert.equal(url.hash, '#fan-points');
  assert.equal(routing.getLanguageTargets('/en/plays', url.search, url.hash).jaHref, '/plays'+url.search+url.hash);
  assert.equal(routing.getLanguageTargets('/search', '?q=sato&gender=male').enHref, '/en/search?q=sato');
  assert.equal(routing.getLanguageTargets('/actors', '?q=sato&page=2&gender=male').enHref, '/en/actors?q=sato&gender=male&page=2');
});
