import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkImportPlan, renderWorkImportReport, sourceCreditId } from '../lib/work-import-plan.mjs';

const evidence = [{ url: 'https://example.com/official', note: '公式の配役と人物の確認', checkedAt: '2026-10-16T01:00:00Z' }];
const actor = { id: 'actor-a', name: '俳優 A', slug: 'actor-a', updated_at: '2026-01-01T00:00:00Z' };
const play = { id: 'play-a', title: '舞台「作品A」', slug: 'work-a', period: '2006年', updated_at: '2026-01-01T00:00:00Z' };
const credit = { sourceActorName: '俳優A', sourceActorUrl: 'https://example.com/actor-a', role_name: '役A', cast_group: null };
function fixture() {
  return { source: { sourceUrl: 'https://example.com/work-a', title: '舞台「作品A」 (2006)', checkedAt: '2026-10-16T01:00:00Z', cast: [{ ...credit }], unparsed: [], scheduleLines: ['2006年8月10日-13日 会場A'] },
    snapshot: { actors: [{ ...actor }], plays: [{ ...play }], casts: [] },
    review: { sourceUrl: 'https://example.com/work-a', scope: { decision: 'include', reason: '漫画原作の舞台作品', evidence } } };
}
// Match the parenthesized year as the existing lookup does, without guessing a slug.
function plan(input = fixture()) { return buildWorkImportPlan(input); }

test('known actors produce review-only cast proposals with original role/group and no guessed billing', () => {
  const result = plan();
  assert.equal(result.rows[0].action, 'add_cast');
  assert.equal(result.rows[0].proposedCast.role_name, '役A');
  assert.equal(Object.hasOwn(result.rows[0].proposedCast, 'billing_order'), false);
  assert.equal(result.writes, 0);
  assert.equal(result.executionSupported, false);
});

test('existing exact credits retain their full manual metadata and other credits are never deleted', () => {
  const input = fixture();
  input.snapshot.casts = [{ id: 'cast-a', play_id: play.id, actor_id: actor.id, role_name: '役A', cast_group: null, note: '手書き補足', billing_order: 7, is_starring: true },
    { id: 'cast-other', play_id: play.id, actor_id: 'someone-else', role_name: '別役', cast_group: null }];
  const result = plan(input);
  assert.equal(result.rows[0].action, 'keep');
  assert.deepEqual(result.rows[0].existingCast, input.snapshot.casts[0]);
  assert.deepEqual(result.existingNotInSource, [input.snapshot.casts[1]]);
});

test('multiple roles and ensemble credits are kept as distinct source facts', () => {
  const input = fixture();
  input.source.cast.push({ ...credit, role_name: '役B※声' }, { ...credit, role_name: null, cast_group: 'アンサンブル' });
  const result = plan(input);
  assert.equal(result.counts.add_cast, 2);
  assert.equal(result.rows[1].proposedCast.role_name, '役B※声');
  assert.deepEqual(result.rows[1].analysis.appearances, ['voice']);
  assert.equal(result.rows[2].proposedCast.role_name, null);
  assert.equal(result.rows[2].proposedCast.cast_group, 'アンサンブル');
  assert.equal(result.rows[2].action, 'hold');
  assert.equal(result.rows[2].storageRecommendation, 'play_credits');
  assert.ok(result.rows[2].issues.includes('ensemble_belongs_in_play_credits'));
});

test('ensemble-only names never request new actor pages, including an explicit new-actor decision', () => {
  for (const group of ['アンサンブル', 'バックダンサー', 'あんステダンサー']) {
    const input = fixture();
    input.source.cast = [{ ...credit, sourceActorName: '未登録の出演者', role_name: null, cast_group: group }];
    for (const actors of [[], [{ sourceActorName: '未登録の出演者', action: 'new', evidence }]]) {
      input.review.actors = actors;
      const result = plan(input);
      assert.equal(result.rows[0].action, 'hold');
      assert.equal(result.rows[0].newActor, null);
      assert.equal(result.counts.prepare_actor, 0);
      assert.deepEqual(result.rows[0].source, input.source.cast[0]);
    }
  }
});

test('ensemble policy preserves existing cast records and does not swallow named or voice roles', () => {
  const input = fixture();
  input.source.cast[0] = { ...credit, role_name: null, cast_group: 'アンサンブル' };
  input.snapshot.casts = [{ id: 'cast-a', play_id: play.id, actor_id: actor.id, role_name: null, cast_group: 'アンサンブル', note: '既存の補足', billing_order: 8 }];
  assert.equal(plan(input).rows[0].action, 'keep');
  assert.deepEqual(plan(input).rows[0].existingCast, input.snapshot.casts[0]);
  input.source.cast[0].role_name = '役A※声';
  const result = plan(input);
  assert.equal(result.rows[0].storageRecommendation, 'casts');
  assert.ok(!result.rows[0].issues.includes('ensemble_belongs_in_play_credits'));
});

test('a homophone slug is never sufficient and a separate new actor needs explicit exclusions', () => {
  const input = fixture();
  input.source.cast[0] = { ...credit, sourceActorName: '俳優亜', sourceActorUrl: 'https://example.com/actor-a' };
  assert.equal(plan(input).rows[0].action, 'hold');
  input.review.actors = [{ sourceActorName: '俳優亜', action: 'new', evidence }];
  assert.ok(plan(input).rows[0].issues.includes('unresolved_actor_collision'));
  input.review.actors[0].excludeActorIds = [actor.id];
  const row = plan(input).rows[0];
  assert.equal(row.action, 'prepare_actor');
  assert.equal(row.actor, null);
  assert.equal(row.newActor.name, '俳優亜');
  assert.equal(Object.hasOwn(row.newActor, 'slug'), false);
});

test('reviewed aliases require evidence and the current actor version', () => {
  const input = fixture(); input.source.cast[0].sourceActorName = '旧芸名';
  input.review.actors = [{ sourceActorName: '旧芸名', action: 'link', actorId: actor.id, expectedName: actor.name, expectedUpdatedAt: actor.updated_at, evidence }];
  assert.equal(plan(input).rows[0].action, 'add_cast');
  input.review.actors[0].expectedUpdatedAt = 'old';
  assert.ok(plan(input).rows[0].issues.includes('stale_actor_decision'));
  input.review.actors[0].evidence = [];
  assert.ok(plan(input).rows[0].issues.includes('missing_identity_evidence'));
});

test('source incompleteness, missing scope and ambiguous plays hold the entire work', () => {
  const input = fixture(); input.source.unparsed.push('読めない配役行');
  assert.ok(plan(input).blockers.some((issue) => issue.code === 'incomplete_source'));
  assert.equal(plan(input).rows[0].action, 'hold');
  input.source.unparsed = []; input.review.scope.decision = 'exclude';
  assert.equal(plan(input).rows[0].action, 'hold');
  input.review.scope.decision = 'include'; input.snapshot.plays.push({ ...play, id: 'other-play' });
  assert.equal(plan(input).rows[0].action, 'hold');
});

test('year conflicts and stale explicit work selections cannot bypass identity checks', () => {
  const input = fixture(); input.snapshot.plays[0].period = '2007年';
  input.review.play = { id: play.id, slug: play.slug, expectedUpdatedAt: play.updated_at, evidence };
  assert.ok(plan(input).blockers.some((issue) => issue.code === 'conflicting_play_year'));
  input.snapshot.plays[0].period = '2006年'; input.review.play.expectedUpdatedAt = 'old';
  assert.ok(plan(input).blockers.some((issue) => issue.code === 'stale_or_unverified_play_decision'));
});

test('conditioned existing roles and legacy credits prevent unqualified duplicates', () => {
  const input = fixture(); input.snapshot.casts.push({ id: 'cast-a', actor_id: actor.id, play_id: play.id, role_name: '役A', cast_group: '福岡公演※日替わりゲスト' });
  assert.ok(plan(input).rows[0].issues.includes('existing_credit_has_different_conditions'));
  input.snapshot.casts[0].cast_group = null; input.snapshot.casts[0].role_name = '役A※声';
  assert.ok(plan(input).rows[0].issues.includes('existing_credit_has_different_conditions'));
  input.snapshot.casts = []; input.snapshot.plays[0].credits = [{ label: 'バックダンサー', value: '俳優A' }];
  assert.ok(plan(input).rows[0].issues.includes('legacy_credit_requires_review'));
  input.snapshot.plays[0].credits[0].value = '俳優 A';
  assert.ok(plan(input).rows[0].issues.includes('legacy_credit_requires_review'));
});

test('duplicate source/target credits and unsafe source text are review issues', () => {
  const input = fixture(); input.source.cast.push({ ...credit });
  assert.ok(plan(input).rows[1].issues.includes('duplicate_source_credit'));
  assert.equal(plan(input).counts.hold, 2);
  input.source.cast = [{ ...credit, role_name: '<img src=x>' }];
  assert.equal(plan(input).rows[0].action, 'hold');
  input.source.cast = [{ ...credit, role_name: '役A※意味未確認の補足' }];
  assert.ok(plan(input).rows[0].issues.includes('unresolved_credit_annotation'));
});

test('reviewed new actors remain separate from unresolved and already existing identities', () => {
  const input = fixture(); input.source.cast[0].sourceActorName = '新人'; input.source.cast[0].sourceActorUrl = null;
  assert.equal(plan(input).rows[0].identity, 'new_actor_candidate');
  assert.ok(plan(input).rows[0].newActor.requiredBeforeCreation.includes('verified_identity'));
  input.review.actors = [{ sourceActorName: '新人', action: 'new', evidence }];
  assert.equal(plan(input).rows[0].action, 'prepare_actor');
  assert.equal(plan(input).completeForExistingActors, false);
  input.source.cast[0].sourceActorName = credit.sourceActorName;
  input.review.actors[0].sourceActorName = credit.sourceActorName;
  assert.ok(plan(input).rows[0].issues.includes('existing_actor_requires_review'));
});

test('plans are deterministic, leave input unchanged and retain full source conditions', () => {
  const input = fixture(); const before = structuredClone(input);
  assert.deepEqual(plan(input), plan(input));
  assert.deepEqual(input, before);
  assert.equal(sourceCreditId(credit), sourceCreditId({ ...credit, sourceActorUrl: null }));
  assert.ok(renderWorkImportReport(plan(input)).includes('本番への書込みは0件'));
  assert.ok(renderWorkImportReport(plan(input)).includes('配役追加案'));
});
