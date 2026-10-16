import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStageTestDb, readMigration, sqlClient, rpcSqlClient, actorId, otherActorId, playId } from './test-support/stage-test-db.mjs';
import { buildWorkImportPlan } from '../lib/work-import-plan.mjs';
import { buildWorkCandidateBatch, stageWorkCandidates } from '../lib/stage-work-candidates.mjs';
import { acceptCandidateWithHistory } from '../lib/accept-external-candidate.mjs';
import { actorQueueKey, filterCandidateActor, buildCandidateActorQueue } from '../lib/candidate-actor-scope.mjs';
import { refreshExternalRow } from '../lib/external-refresh.mjs';
let db;
before(async () => {
  db = await createStageTestDb();
  await db.exec(await readMigration('2026-10-16_atomic_accept_external_cast_candidate.sql'));
  await db.exec(await readMigration('2026-10-16_work_cast_candidate_fields.sql'));
});
after(async () => { await db?.close(); });
beforeEach(async () => { await db.exec('truncate external_cast_candidates,external_import_logs,casts cascade'); });
const evidence = [{ url: 'https://example.com/official', note: '漫画原作の舞台として確認', checkedAt: '2026-10-16T00:00:00Z' }];
function fixture() {
  return buildWorkImportPlan({
    source: { sourceUrl: 'https://kira-hai.net/work-a', title: '作品A (2006)', checkedAt: '2026-10-16T00:00:00Z', unparsed: [], cast: [
      { sourceActorName: '俳優A', sourceActorUrl: 'https://kira-hai.net/actor-a', role_name: '役A', cast_group: null },
      { sourceActorName: '俳優B', sourceActorUrl: null, role_name: null, cast_group: 'アンサンブル' },
      { sourceActorName: '新人C', sourceActorUrl: null, role_name: null, cast_group: 'アンサンブル' },
    ] },
    snapshot: { actors: [{ id: actorId, name: '俳優A' }, { id: otherActorId, name: '俳優B' }], plays: [{ id: playId, title: '作品A', period: '2006年' }], casts: [] },
    review: { sourceUrl: 'https://kira-hai.net/work-a', scope: { decision: 'include', reason: '漫画原作', evidence } },
  });
}
const client = () => rpcSqlClient(db);
const rows = async () => (await db.query('select * from external_cast_candidates order by source_order')).rows;
const stage = (plan = fixture()) => stageWorkCandidates(client(), plan, { write: true });
const counts = async () => (await db.query('select (select count(*)::int from external_cast_candidates) as candidates, (select count(*)::int from casts) as casts, (select count(*)::int from external_import_logs) as logs')).rows[0];

test('migration is repeatable and a default dry run cannot call any database API', async () => {
  await db.exec(await readMigration('2026-10-16_work_cast_candidate_fields.sql'));
  const result = await stageWorkCandidates(null, fixture());
  assert.equal(result.writes, 0);
  assert.equal(result.batch.items.length, 3);
  assert.deepEqual(await counts(), { candidates: 0, casts: 0, logs: 0 });
});

test('work staging stores profileless actors, ensemble group, source order and evidence separately', async () => {
  const result = await stage(); const saved = await rows();
  assert.equal(result.created, 3);
  assert.equal(saved[1].source_actor_url, null);
  assert.equal(saved[1].source_role_raw, null);
  assert.equal(saved[1].source_cast_group, 'アンサンブル');
  assert.equal(saved[1].source_order, 2);
  assert.equal(saved[1].source_evidence.links[0].url, 'https://kira-hai.net/work-a');
  assert.equal(saved[2].matched_actor_id, null);
  assert.equal(saved[2].status, 'needs_review');
  assert.deepEqual(await counts(), { candidates: 3, casts: 0, logs: 1 });
});

test('repeating the same batch keeps candidate IDs and creates no duplicate log', async () => {
  const first = await stage(); const again = await stage();
  assert.equal(again.created, 0);
  assert.deepEqual(again.rows.map((row) => row.candidate_id), first.rows.map((row) => row.candidate_id));
  assert.deepEqual(await counts(), { candidates: 3, casts: 0, logs: 1 });
});

test('legacy candidate review is reused and manual matches, confidence and notes are preserved', async () => {
  const { rows: [legacy] } = await db.query(`insert into external_cast_candidates(source_actor_name,source_actor_url,source_work_title,source_work_url,source_role_raw,matched_actor_id,matched_play_id,confidence,note)
    values('旧名','https://kira-hai.net/actor-a','以前の表記','https://kira-hai.net/work-a','役A',$1,$2,99,'人が照合したメモ') returning *`, [otherActorId, playId]);
  await stage(); const saved = (await rows()).find((row) => row.id === legacy.id);
  assert.equal(saved.matched_actor_id, otherActorId);
  assert.equal(saved.confidence, 99);
  assert.equal(saved.note, '人が照合したメモ');
  assert.ok(saved.source_credit_key);
  await stage(); // The attached key must remain reusable after an alias refresh.
  assert.equal((await rows()).length, 3);
});

test('deferred, rejected and accepted review states cannot be reset by re-staging', async () => {
  await stage(); const initial = await rows();
  await db.query("update external_cast_candidates set status='rejected',note='無視の理由' where id=$1", [initial[0].id]);
  await db.query("update external_cast_candidates set status='accepted' where id=$1", [initial[1].id]);
  const result = await stage(); const saved = await rows();
  assert.equal(result.review_preserved, 3);
  assert.deepEqual(saved.map((row) => row.status), ['rejected', 'accepted', 'needs_review']);
  assert.equal(saved[0].note, '無視の理由');
});

test('a history failure rolls back the entire candidate batch', async () => {
  await db.exec("create function test_reject_work_log() returns trigger language plpgsql as $$ begin raise exception 'test log failure'; end $$; create trigger test_fail_work_log before insert on external_import_logs for each row execute function test_reject_work_log();");
  try { await assert.rejects(stage(), /test log failure/); assert.deepEqual(await counts(), { candidates: 0, casts: 0, logs: 0 }); }
  finally { await db.exec('drop trigger test_fail_work_log on external_import_logs; drop function test_reject_work_log()'); }
});

test('a malformed later row also rolls back earlier rows, and duplicate keys are rejected', async () => {
  const batch = buildWorkCandidateBatch(fixture());
  batch.items[2].source_actor_name = '<img src=x>';
  const result = await client().rpc('stage_external_work_cast_candidates', { p_work_url: batch.workUrl, p_batch_key: batch.key, p_items: batch.items });
  assert.match(result.error.message, /markup/);
  assert.equal((await rows()).length, 0);
  batch.items[2] = batch.items[0];
  const duplicate = await client().rpc('stage_external_work_cast_candidates', { p_work_url: batch.workUrl, p_batch_key: batch.key, p_items: batch.items });
  assert.match(duplicate.error.message, /duplicate_source_credit/);
});

test('adoption preserves a roleless ensemble credit and is repeatable', async () => {
  await stage(); const row = (await rows())[1];
  const first = await acceptCandidateWithHistory(client(), row, null);
  const again = await acceptCandidateWithHistory(client(), row, null);
  assert.equal(first.atomic, true); assert.equal(again.already_accepted, true);
  const { rows: [cast] } = await db.query('select * from casts');
  assert.equal(cast.role_name, null); assert.equal(cast.cast_group, 'アンサンブル');
  assert.equal(cast.billing_order, null);
  const { rows: [log] } = await db.query("select * from external_import_logs where target_type='cast'");
  assert.equal(log.source_url, 'https://kira-hai.net/work-a');
  assert.equal(log.details.source_cast_group, 'アンサンブル');
  assert.equal(log.details.source_order, 2);
  assert.deepEqual(await counts(), { candidates: 3, casts: 1, logs: 2 });
});

test('an existing ensemble is linked while retaining handwritten metadata', async () => {
  await stage(); const row = (await rows())[1];
  await db.query("insert into casts(actor_id,play_id,cast_group,billing_order,is_starring) values($1,$2,'アンサンブル',8,true)", [otherActorId, playId]);
  assert.equal((await acceptCandidateWithHistory(client(), row, null)).cast_created, false);
  assert.equal((await db.query('select billing_order from casts')).rows[0].billing_order, 8);
});

test('an adoption log failure rolls back the ensemble cast and status together', async () => {
  await stage(); const row = (await rows())[1];
  await db.exec("create function test_reject_adoption_log() returns trigger language plpgsql as $$ begin raise exception 'adoption log failure'; end $$; create trigger test_fail_adoption_log before insert on external_import_logs for each row execute function test_reject_adoption_log();");
  try {
    await assert.rejects(acceptCandidateWithHistory(client(), row, null), /adoption log failure/);
    assert.equal((await counts()).casts, 0);
    assert.equal((await rows())[1].status, 'pending');
  } finally { await db.exec('drop trigger test_fail_adoption_log on external_import_logs; drop function test_reject_adoption_log()'); }
});

test('stale timestamps/groups, legacy clients and unlinked actors stop before adoption', async () => {
  await stage(); const saved = await rows();
  await assert.rejects(acceptCandidateWithHistory(client(), { ...saved[1], source_cast_group: 'ダンサー' }, null), /更新/);
  await assert.rejects(acceptCandidateWithHistory(client(), { ...saved[1], updated_at: '2020-01-01T00:00:00Z' }, null), /更新/);
  await assert.rejects(acceptCandidateWithHistory(client(), saved[2], null), /照合先/);
  const legacy = await client().rpc('accept_external_cast_candidate', { p_candidate_id: saved[1].id, p_expected_actor_id: otherActorId, p_expected_play_id: playId, p_role_name: null });
  assert.match(legacy.error.message, /requires_v2/);
  assert.equal((await counts()).casts, 0);
});

test('missing new RPC never falls back to separate writes or discards a group', async () => {
  await stage(); const row = (await rows())[1];
  const absent = { rpc: async (name) => ({ error: { code: 'PGRST202', message: `Missing ${name}` } }), from: () => { throw new Error('Unexpected fallback'); } };
  await assert.rejects(acceptCandidateWithHistory(absent, row, null), /SQLが未適用/);
  await assert.rejects(stageWorkCandidates(absent, fixture(), { write: true }), /SQLが未適用/);
});

test('voice and venue conditions cannot gain an unqualified duplicate', async () => {
  await stage(); const row = (await rows())[0];
  await db.query("insert into casts(actor_id,play_id,role_name,cast_group) values($1,$2,'役A※声','福岡公演※日替わりゲスト')", [actorId, playId]);
  await assert.rejects(acceptCandidateWithHistory(client(), row, '役A'), /既存配役/);
  assert.equal((await counts()).casts, 1);
  await db.query("update casts set role_name='役A / 別役',cast_group=null");
  await assert.rejects(acceptCandidateWithHistory(client(), row, '役A'), /既存配役/);
  assert.equal((await counts()).casts, 1);
});

test('a stale client that omitted the new fields cannot use the old compatibility writer', async () => {
  await stage(); const saved = (await rows())[1];
  const { source_cast_group: _group, source_credit_key: _key, ...stale } = saved;
  const legacy = { ...sqlClient(db), rpc: async () => ({ error: { code: 'PGRST202', message: 'Missing accept_external_cast_candidate' } }) };
  await assert.rejects(acceptCandidateWithHistory(legacy, stale, null), /SQLが未適用/);
  assert.equal((await counts()).casts, 0);
});

test('new staging and adoption use existing RLS and deny non-admin or anonymous callers', async () => {
  await db.exec(`set role authenticated; set request.jwt.claims='{"email":"viewer@example.test"}';`);
  try { await assert.rejects(stage(), /row-level security/); }
  finally { await db.exec('reset role; reset request.jwt.claims'); }
  await db.exec('set role anon');
  try { await assert.rejects(stage(), /permission denied/); }
  finally { await db.exec('reset role'); }
  assert.equal((await counts()).candidates, 0);
});

test('profileless queue entries stay separate and manual matching targets only one candidate', async () => {
  await stage(); const saved = await rows();
  await db.query('update external_cast_candidates set matched_actor_id=null,source_actor_name=$1 where id=$2', ['新人C', saved[1].id]);
  const unknown = (await rows()).filter((row) => !row.matched_actor_id);
  const queue = buildCandidateActorQueue(unknown);
  assert.equal(queue.length, 2); assert.notEqual(actorQueueKey(queue[0]), actorQueueKey(queue[1]));
  await filterCandidateActor(sqlClient(db).from('external_cast_candidates').update({ matched_actor_id: actorId }), queue[0]);
  const after = await rows();
  assert.equal(after.find((row) => row.id === queue[0].candidateId).matched_actor_id, actorId);
  assert.equal(after.find((row) => row.id === queue[1].candidateId).matched_actor_id, null);
  assert.throws(() => filterCandidateActor(null, { sourceActorUrl: null }), /再読み込み/);
});

test('the actor-page importer cannot overwrite a work-origin credit or its manual review', async () => {
  await stage(); const row = (await rows())[0];
  const refreshed = await refreshExternalRow(sqlClient(db), 'external_cast_candidates', { source_actor_name: '違う名前', matched_actor_id: otherActorId, updated_at: new Date().toISOString() }, { id: row.id });
  assert.equal(refreshed.source_actor_name, row.source_actor_name);
  assert.equal(refreshed.matched_actor_id, actorId);
});
