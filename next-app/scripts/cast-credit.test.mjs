import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCastCredit, castCreditKey } from '../lib/cast-credit.mjs';

test('separates location and rotating guest while retaining the exact original', () => {
  const input = { role_name: '手塚国光', cast_group: '福岡公演※日替わりゲスト' };
  const result = analyzeCastCredit(input);
  assert.deepEqual(result.locations, ['福岡']);
  assert.deepEqual(result.appearances, ['rotating_guest']);
  assert.equal(result.groupName, null);
  assert.equal(result.raw.castGroup, input.cast_group);
  assert.equal(result.needsReview, false);
});
test('keeps team, school and guest status independent', () => {
  const result = analyzeCastCredit({ role_name: '白石蔵ノ介', cast_group: '四天宝寺※Ｂ【ゲスト出演】' });
  assert.equal(result.groupName, '四天宝寺');
  assert.deepEqual(result.teams, ['B']);
  assert.deepEqual(result.appearances, ['guest']);
});
test('separates generation without losing school', () => {
  const result = analyzeCastCredit({ cast_group: '青春学園※４代目' });
  assert.equal(result.groupName, '青春学園');
  assert.deepEqual(result.generations, [4]);
});
test('voice and video are distinct credits', () => {
  assert.deepEqual(analyzeCastCredit({ role_name: '鶴丸国永※声' }).appearances, ['voice']);
  assert.notEqual(castCreditKey({ role_name: '鶴丸国永※声' }), castCreditKey({ role_name: '鶴丸国永※映像出演' }));
  assert.notEqual(castCreditKey({ role_name: '鶴丸国永※声' }), castCreditKey({ role_name: '鶴丸国永' }));
});
test('date restrictions are retained without guessing the year', () => {
  const result = analyzeCastCredit({ role_name: '薬研藤四郎※8月6日の公演のみ出演' });
  assert.deepEqual(result.roleNames, ['薬研藤四郎']);
  assert.deepEqual(result.scheduleNotes, ['8月6日の公演のみ出演']);
});
test('additional roles behind a note marker remain unresolved, never discarded', () => {
  const result = analyzeCastCredit({ role_name: '豊前江※犬山道節・浜路' });
  assert.equal(result.needsReview, true);
  assert.equal(result.unresolved[0].text, '犬山道節・浜路');
  assert.equal(result.raw.roleName, '豊前江※犬山道節・浜路');
  assert.notEqual(castCreditKey({ role_name: '村雲江※犬坂毛野' }), castCreditKey({ role_name: '村雲江' }));
});
test('unambiguous slash-separated roles survive without treating middle dots as delimiters', () => {
  assert.deepEqual(analyzeCastCredit({ role_name: '黒田如水 / 黒田孝高 / 黒田官兵衛' }).roleNames, ['黒田如水', '黒田孝高', '黒田官兵衛']);
  assert.deepEqual(analyzeCastCredit({ role_name: '支倉常長・虎哉宗乙' }).roleNames, ['支倉常長・虎哉宗乙']);
});
test('equivalent note punctuation matches but teams and conditions do not collapse', () => {
  assert.equal(castCreditKey({ cast_group: '聖ルドルフ学院【日替わりゲスト】' }), castCreditKey({ cast_group: '聖ルドルフ学院※日替わりゲスト' }));
  assert.notEqual(castCreditKey({ cast_group: '四天宝寺※A' }), castCreditKey({ cast_group: '四天宝寺※B' }));
  assert.notEqual(castCreditKey({ role_name: '忍足侑士※東京公演のみ' }), castCreditKey({ role_name: '忍足侑士※大阪公演のみ' }));
});
test('normalizes compatibility glyphs without rewriting the source and keeps name parentheses', () => {
  const result = analyzeCastCredit({ role_name: '⼤包平', cast_group: null });
  assert.deepEqual(result.roleNames, ['大包平']);
  assert.equal(result.raw.roleName, '⼤包平');
  assert.deepEqual(analyzeCastCredit({ role_name: '母(若年期)' }).roleNames, ['母(若年期)']);
});
test('accepts empty fields without fabricating roles or standard appearances', () => {
  const result = analyzeCastCredit();
  assert.deepEqual(result.roleNames, []);
  assert.deepEqual(result.appearances, []);
  assert.equal(result.groupName, null);
});

test('embedded markup is retained as source text and never split at URL slashes', () => {
  const raw = '一松 <img src="https://example.test/icon.gif" /> 別作品：別役';
  const result = analyzeCastCredit({ role_name: raw });
  assert.equal(result.raw.roleName, raw);
  assert.deepEqual(result.roleNames, []);
  assert.equal(result.needsReview, true);
  assert.deepEqual(result.qualityFlags, [{ field: 'roleName', code: 'embedded_markup' }]);
  assert.notEqual(castCreditKey({ role_name: raw }), castCreditKey({ role_name: '別役 <img src="https://example.test/a.gif">' }));
});
