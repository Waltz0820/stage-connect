import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCastCredit } from '../lib/cast-credit.mjs';
import { suggestCreditDraft, createReviewDataset } from '../lib/cast-credit-preview.mjs';

test('a voice credit applies to its single role and an unspecified role stays unknown', () => {
  assert.deepEqual(suggestCreditDraft(analyzeCastCredit({ role_name: '役A※声' })).roles[0].media, ['voice']);
  assert.deepEqual(suggestCreditDraft(analyzeCastCredit({ role_name: '役A' })).roles[0].media, []);
});

test('an ambiguous voice modifier on multiple roles is not copied across every role', () => {
  const draft = suggestCreditDraft(analyzeCastCredit({ role_name: '役A / 役B※声' }));
  assert.deepEqual(draft.roles.map((role) => role.media), [[], []]);
  assert.ok(draft.scopeNote.includes('確認'));
});

test('team, guest and date/venue conditions survive independently', () => {
  const draft = suggestCreditDraft(analyzeCastCredit({ role_name: '役A※7月30日', cast_group: '四天宝寺※B【ゲスト出演】' }));
  assert.equal(draft.group, '四天宝寺');
  assert.equal(draft.teams, 'B');
  assert.deepEqual(draft.participation, ['guest']);
  assert.equal(draft.schedule, '7月30日');
  assert.equal(draft.conditionScope, 'unknown');
});

test('source data is unchanged, missing roles are allowed, and synthetic data is outside DB totals', () => {
  const input = { capturedAt: '2026-10-15T00:00:00Z', actors: [{ id: 'a', name: '俳優' }], plays: [{ id: 'p', title: '作品', franchise_id: 's' }], franchises: [{ id: 's', name: 'シリーズ', slug: 'series' }], casts: [{ id: 'c', actor_id: 'a', play_id: 'p', role_name: null, cast_group: 'アンサンブル' }, { id: 'v', actor_id: 'a', play_id: 'p', role_name: '役※声' }] };
  const before = JSON.stringify(input);
  const result = createReviewDataset(input);
  assert.equal(JSON.stringify(input), before);
  assert.equal(result.stats.total, 2);
  assert.equal(result.records[0].id, 'c');
  assert.deepEqual(result.records[0].draft.roles, []);
  assert.equal(result.records[0].draft.group, 'アンサンブル');
  assert.equal(result.synthetic.kind, 'synthetic');
  assert.deepEqual(result.synthetic.draft.roles.map((role) => role.media), [['stage'], ['voice']]);
  assert.equal(result.revision, createReviewDataset(input).revision);
});

test('unknown role-like notes and markup stay reviewable without inventing roles', () => {
  const result = createReviewDataset({ actors: [], plays: [], franchises: [], casts: [{ id: 'a', role_name: '豊前江※犬山道節・浜路' }, { id: 'b', role_name: '<img src="/x.gif">別作品' }] });
  assert.equal(result.stats.needsReview, 2);
  assert.equal(result.stats.unresolved, 1);
  assert.equal(result.stats.quality, 1);
  assert.deepEqual(result.records[0].draft.roles.map((role) => role.name), ['豊前江']);
  assert.equal(result.records[0].parsed.unresolved[0].text, '犬山道節・浜路');
  assert.deepEqual(result.records[1].draft.roles, []);
});
