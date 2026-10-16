import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSourceLookup, sourceNameKey, sourceTitleKey, resolveSourceMatch, resolveSourceActor, resolveSourcePlay, readAllRows } from '../lib/source-match.mjs';

test('name collisions and conflicting aliases are ambiguous, never first-row wins', () => {
  const lookup = buildSourceLookup([{ id: 'a', name: '佐藤 太郎' }, { id: 'b', name: '佐藤太郎' }, { id: 'c', name: '別名' }], ['name'], sourceNameKey);
  assert.equal(resolveSourceMatch(lookup, ['佐藤太郎'], sourceNameKey).match, null);
  assert.equal(resolveSourceMatch(lookup, ['佐藤太郎'], sourceNameKey).status, 'ambiguous');
  assert.equal(resolveSourceMatch(lookup, ['別名'], sourceNameKey).match.id, 'c');
  assert.equal(resolveSourceMatch(lookup, ['別名', '佐藤 太郎'], sourceNameKey).status, 'ambiguous');
});
test('rerun and cancelled performances do not collapse into the original title', () => {
  assert.notEqual(sourceTitleKey('アー'), sourceTitleKey('ア'));
  const lookup = buildSourceLookup([{ id: 'a', title: '舞台「作品」', period: '2020年' }, { id: 'b', title: '【公演中止】舞台「作品」', period: '2020年' }], ['title'], sourceTitleKey);
  assert.equal(resolveSourcePlay(lookup, { sourceWorkTitle: '舞台『作品』', sourceYear: 2020 }).match.id, 'a');
  assert.equal(resolveSourcePlay(lookup, { sourceWorkTitle: '【公演中止】舞台「作品」', sourceYear: 2020 }).match.id, 'b');
  assert.equal(resolveSourcePlay(lookup, { sourceWorkTitle: '舞台「作品」再演', sourceYear: 2020 }).match, null);
});
test('homophone slugs and kana cannot establish a person match with different kanji', () => {
  const lookup = buildSourceLookup([{ id: 'other', name: '村上 幸平', kana: 'むらかみこうへい', slug: 'murakami-kohei' }], ['name', 'kana', 'slug'], sourceNameKey);
  const result = resolveSourceActor(lookup, { sourceActorName: '村上耕平', sourceActorUrl: 'https://kira-hai.net/murakami-kohei' });
  assert.equal(result.status, 'needs_review');
  assert.equal(result.match, null);
  assert.equal(resolveSourceActor(lookup, { sourceActorName: '村上幸平' }).match.id, 'other');
});
test('explicit source aliases can establish a renamed actor match', () => {
  const lookup = buildSourceLookup([{ id: 'actor', name: '土屋 佑壱', slug: 'tsuchiya-yuichi' }], ['name', 'slug'], sourceNameKey);
  assert.equal(resolveSourceActor(lookup, { sourceActorName: '土屋裕一', sourceActorUrl: 'https://kira-hai.net/tsuchiya-yuichi' }).status, 'needs_review');
  assert.equal(resolveSourceActor(lookup, { sourceActorName: '土屋裕一', aliasTo: '土屋佑壱' }).match.id, 'actor');
});
test('trailing source year can be matched, but conflicting or ambiguous years are blocked', () => {
  const lookup = buildSourceLookup([{ id: 'a', title: 'BLEACH', period: '2006年' }, { id: 'b', title: 'BLEACH', period: '2007年' }], ['title'], sourceTitleKey);
  assert.equal(resolveSourcePlay(lookup, { sourceWorkTitle: 'BLEACH (2006)', sourceYear: 2006 }).match.id, 'a');
  assert.equal(resolveSourcePlay(lookup, { sourceWorkTitle: 'BLEACH', sourceYear: 2008 }).match, null);
  assert.equal(resolveSourcePlay(lookup, { sourceWorkTitle: 'BLEACH' }).status, 'ambiguous');
});
test('pagination reads all rows even when server returns fewer rows than requested', async () => {
  const source = Array.from({ length: 7 }, (_, id) => ({ id }));
  const mock = { from: () => ({ select: () => ({ order: () => ({ range: async (start, end) => ({ data: source.slice(start, Math.min(end + 1, start + 2)), error: null }) }) }) }) };
  assert.deepEqual(await readAllRows(mock, 'actors', '*', { pageSize: 5 }), source);
  assert.deepEqual(await readAllRows(mock, 'actors', '*', { offset: 2, limit: 3, pageSize: 5 }), source.slice(2, 5));
});
