import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as cheerio from 'cheerio';

const dir = await mkdtemp(join(tmpdir(), 'stage-play-cast-'));
after(async () => {
  assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
  assert.ok(basename(dir).startsWith('stage-play-cast-'));
  await rm(dir, { recursive: true, force: true });
});
const require = createRequire(import.meta.url);
for (const module of ['lib/play-cast.ts', 'lib/en-copy.ts', 'lib/en-term-map.ts', 'components/PlayCastRoles.tsx']) {
  const source = await readFile(new URL(`../${module}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  const target = join(dir, module.replace(/\.tsx?$/, '.js'));
  await mkdir(join(dir, module.split('/')[0]), { recursive: true });
  await writeFile(target, outputText.replaceAll('require("react/jsx-runtime")', `require(${JSON.stringify(require.resolve('react/jsx-runtime'))})`));
}
const { groupPlayCast } = require(join(dir, 'lib/play-cast.js'));
const { translateCastNoteEn } = require(join(dir, 'lib/en-copy.js'));
const { PlayCastRoles } = require(join(dir, 'components/PlayCastRoles.js'));
const row = (overrides = {}) => ({ slug: 'actor', name: '俳優', nameEn: 'Actor', roleName: '役A', castGroup: null, note: null, isStarring: false, ...overrides });
const render = (item, locale = 'ja') => cheerio.load(renderToStaticMarkup(React.createElement(PlayCastRoles, { ...item, locale })));

test('multiple roles retain their own notes, group order and billing order without changing inputs', () => {
  const rows = [row({ note: '東京公演' }), row({ slug: 'other' }), row({ roleName: '役B', note: '福岡公演', isStarring: true }), row({ castGroup: '声のみ', note: '録音' })];
  const before = structuredClone(rows);
  const groups = groupPlayCast(rows);
  assert.deepEqual(rows, before);
  assert.deepEqual(groups.map(g => g.name), [null, '声のみ']);
  assert.deepEqual(groups[0].items.map(i => i.slug), ['actor', 'other']);
  const item = groups[0].items[0];
  assert.equal(item.isStarring, true);
  const $ = render(item);
  assert.deepEqual($('.cast-credit').toArray().map(n => [$(n).find('.cast-role').text(), $(n).find('.cast-note').text()]), [['役A', '東京公演'], ['役B', '福岡公演']]);
});

test('exact duplicate credits merge, but different conditions on the same role survive', () => {
  const rows = [row({ note: '昼' }), row({ note: '昼' }), row({ note: '夜' }), row({ roleName: null, note: '追加注記' })];
  const item = groupPlayCast(rows)[0].items[0];
  assert.equal(item.credits.length, 3);
  assert.deepEqual(render(item)('.cast-note').toArray().map(n => cheerio.load(n).text()), ['昼', '夜', '追加注記']);
});

test('notes cannot disappear when there are more than three roles; plain cards keep their summary', () => {
  const rows = ['A', 'B', 'C', 'D'].map(roleName => row({ roleName }));
  const plain = groupPlayCast(rows)[0].items[0];
  assert.equal(render(plain)('.cast-role').text(), 'A / B / C / ほか1役');
  assert.equal(render(plain, 'en')('.cast-role').text(), 'A / B / C / 1 more');
  rows[3].note = '最終公演のみ';
  const annotated = render(groupPlayCast(rows)[0].items[0]);
  assert.equal(annotated('.cast-role').last().text(), 'D');
  assert.equal(annotated('.cast-note').text(), '最終公演のみ');
});

test('blank notes add no UI, note-only credits render and untrusted text stays plain text', () => {
  assert.equal(render(groupPlayCast([row({ roleName: null, note: '  ' })])[0].items[0])('body').text(), '');
  const note = '<script>alert("x")</script>\n【福岡】※日替わりゲスト';
  const $ = render(groupPlayCast([row({ roleName: null, note })])[0].items[0], 'en');
  assert.equal($('script').length, 0);
  assert.equal($('.cast-note').text(), note);
  assert.equal(translateCastNoteEn(note), note);
});

test('coach and guest dates translate without dropping dates, times or second roles', () => {
  assert.equal(translateCastNoteEn('コーチ'), 'Coach');
  assert.equal(translateCastNoteEn('ゲスト出演：7月12日14:00／18:30、7月14日12:30／17:00公演。'), 'Guest appearance: July 12, 14:00 / 18:30; July 14, 12:30 / 17:00.');
  assert.equal(translateCastNoteEn('ゲスト出演：7月15日12:00公演。'), 'Guest appearance: July 15, 12:00.');
  for (const note of ['ゲスト出演：13月12日14:00公演。', 'ゲスト出演：7月12日25:00公演。', 'ゲスト出演：日時未定']) assert.equal(translateCastNoteEn(note), note);
  const item = groupPlayCast([row({ roleName: 'アイリーン・アドラー／ジェームズ・ボンド', note: 'コーチ' })])[0].items[0];
  const $ = render(item, 'en');
  assert.equal($('.cast-note').text(), 'Coach');
  assert.ok($('.cast-role').text().includes('アイリーン・アドラー'));
  assert.ok($('.cast-role').text().includes('ジェームズ・ボンド'));
});

test('long performance limitations are translated completely', () => {
  const note = '大阪公演（2022年11月3日〜6日）は、一部楽曲を除くライブシーンで橋本真一の歌唱録音を使用。ストーリー場面も身体の負担を考慮し、一部台詞のカット・話者変更あり。';
  const text = render(groupPlayCast([row({ note })])[0].items[0], 'en')('.cast-note').text();
  assert.equal(text, "For the Osaka performances (November 3–6, 2022), Shinichi Hashimoto's recorded vocals were used in the live concert scenes, except for some songs. To reduce physical strain, some lines in the story scenes were also cut or reassigned.");
});
