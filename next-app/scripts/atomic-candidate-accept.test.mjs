import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStageTestDb, readMigration, sqlClient, actorId, otherActorId, playId } from './test-support/stage-test-db.mjs';
import { tryAtomicCandidateAccept, acceptCandidateWithHistory } from '../lib/accept-external-candidate.mjs';
let db;
before(async () => { db = await createStageTestDb(); await db.exec(await readMigration('2026-10-16_atomic_accept_external_cast_candidate.sql')); });
after(async () => { await db?.close(); });
beforeEach(async () => { await db.exec('truncate external_cast_candidates,external_import_logs,casts cascade'); });
async function candidate(extra = {}) {
  const input = { source_actor_name: '俳優A', source_actor_url: 'https://kira-hai.net/actor', source_work_title: '作品A', source_work_url: 'https://kira-hai.net/work', source_role_raw: '役A※声', matched_actor_id: actorId, matched_play_id: playId, ...extra };
  const fields = Object.keys(input);
  return (await db.query(`insert into external_cast_candidates(${fields.join(',')}) values(${fields.map((_, i) => `$${i + 1}`).join(',')}) returning *`, Object.values(input))).rows[0];
}
const accept = (row, role = '役A※声', expectedActor = row.matched_actor_id) => db.query('select * from public.accept_external_cast_candidate($1,$2,$3,$4)', [row.id, expectedActor, row.matched_play_id, role]);
async function counts() { return (await db.query("select (select count(*)::int from casts) as casts,(select count(*)::int from external_import_logs) as logs")).rows[0]; }

test('adoption creates one cast, preserves the raw qualifier and logs its source', async () => {
  const row = await candidate();
  const { rows: [result] } = await accept(row);
  assert.equal(result.cast_created, true);
  const cast = (await db.query('select * from casts')).rows[0];
  assert.equal(cast.role_name, '役A※声');
  const adopted = (await db.query('select * from external_cast_candidates')).rows[0];
  assert.equal(adopted.status, 'accepted');
  assert.equal(adopted.accepted_cast_id, cast.id);
  const log = (await db.query('select * from external_import_logs')).rows[0];
  assert.equal(log.details.candidate_id, row.id);
  assert.equal(log.details.source_role_raw, row.source_role_raw);
  assert.equal(log.details.atomic_accept, true);
});

test('repeating an adoption returns the same cast without duplicate history', async () => {
  const row = await candidate(); const first = (await accept(row)).rows[0]; const again = (await accept(row)).rows[0];
  assert.equal(first.accepted_cast_id, again.accepted_cast_id);
  assert.equal(again.already_accepted, true);
  assert.deepEqual(await counts(), { casts: 1, logs: 1 });
  await assert.rejects(accept(row, '違う役'), /explicit_correction/);
});

test('an existing cast is linked without another cast or modification of its metadata', async () => {
  const { rows: [cast] } = await db.query("insert into casts(actor_id,play_id,role_name,billing_order,is_starring) values($1,$2,'役A※声',9,true) returning *", [actorId, playId]);
  const result = (await accept(await candidate())).rows[0];
  assert.equal(result.cast_created, false);
  assert.equal(result.accepted_cast_id, cast.id);
  assert.equal((await db.query('select billing_order from casts')).rows[0].billing_order, 9);
  assert.equal((await db.query('select is_starring from casts')).rows[0].is_starring, true);
});

test('another role for the same actor is added without collapsing the two roles', async () => {
  await db.query("insert into casts(actor_id,play_id,role_name) values($1,$2,'主な役')", [actorId, playId]);
  await accept(await candidate());
  assert.deepEqual(await counts(), { casts: 2, logs: 1 });
});

test('conditioned existing credits require review instead of creating an unconditional duplicate', async () => {
  await db.query("insert into casts(actor_id,play_id,role_name,cast_group) values($1,$2,'役A※声','福岡公演※日替わりゲスト')", [actorId, playId]);
  await assert.rejects(accept(await candidate()), /existing_cast_has_conditions/);
  assert.deepEqual(await counts(), { casts: 1, logs: 0 });
});

test('stale identities, rejected/deferred candidates and markup cannot be adopted', async () => {
  await assert.rejects(accept(await candidate(), '役', otherActorId), /match_changed/);
  await db.exec('truncate external_cast_candidates');
  for (const status of ['rejected', 'needs_review']) {
    const row = await candidate({ status });
    await assert.rejects(accept(row), /not_pending/);
    await db.exec('truncate external_cast_candidates');
  }
  await assert.rejects(accept(await candidate(), '役 <img src="/x">'), /markup/);
  assert.deepEqual(await counts(), { casts: 0, logs: 0 });
});

test('a log failure rolls back the cast insert and the candidate status together', async () => {
  const row = await candidate();
  await db.exec("create function test_reject_log() returns trigger language plpgsql as $$ begin raise exception 'test log failure'; end $$; create trigger test_fail_log before insert on external_import_logs for each row execute function test_reject_log();");
  try {
    await assert.rejects(accept(row), /test log failure/);
    assert.deepEqual(await counts(), { casts: 0, logs: 0 });
    assert.equal((await db.query('select status from external_cast_candidates')).rows[0].status, 'pending');
  } finally { await db.exec('drop trigger test_fail_log on external_import_logs; drop function test_reject_log()'); }
});

test('invoker rights enforce the existing admin policy and deny anonymous execution', async () => {
  const row = await candidate();
  await db.exec(`set role authenticated; set request.jwt.claims='{"email":"viewer@example.test"}';`);
  try { await assert.rejects(accept(row), /not_found_or_not_authorized/); }
  finally { await db.exec('reset role; reset request.jwt.claims'); }
  await db.exec('set role anon');
  try { await assert.rejects(accept(row), /permission denied/); }
  finally { await db.exec('reset role'); }
  assert.deepEqual(await counts(), { casts: 0, logs: 0 });
  await db.exec(`set role authenticated; set request.jwt.claims='{"email":"butcher1629@gmail.com"}';`);
  try { assert.equal((await accept(row)).rows[0].cast_created, true); }
  finally { await db.exec('reset role; reset request.jwt.claims'); }
});

test('only a missing RPC permits compatibility fallback; operational errors stop adoption', async () => {
  const row = { id: 'c', matched_actor_id: actorId, matched_play_id: playId };
  const rpc = (error, data = null) => ({ rpc: async () => ({ data, error }) });
  assert.equal(await tryAtomicCandidateAccept(rpc({ code: 'PGRST202', message: 'Could not find accept_external_cast_candidate' }), row, '役'), null);
  await assert.rejects(tryAtomicCandidateAccept(rpc({ code: '42501', message: 'permission denied' }), row, '役'));
  await assert.rejects(tryAtomicCandidateAccept(rpc({ code: 'P0001', message: 'log failed' }), row, '役'));
  assert.equal((await tryAtomicCandidateAccept(rpc(null, [{ accepted_cast_id: 'cast-id', cast_created: true }]), row, '役')).accepted_cast_id, 'cast-id');
});

const legacyClient = (hooks) => ({ ...sqlClient(db, hooks), rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'Missing accept_external_cast_candidate' } }) });
test('compatibility adoption is repeatable and preserves raw qualifiers', async () => {
  const row = await candidate();
  const first = await acceptCandidateWithHistory(legacyClient(), row, row.source_role_raw);
  const again = await acceptCandidateWithHistory(legacyClient(), row, row.source_role_raw);
  assert.equal(first.atomic, false); assert.equal(first.history_saved, true);
  assert.equal(first.accepted_cast_id, again.accepted_cast_id); assert.equal(again.already_accepted, true);
  assert.deepEqual(await counts(), { casts: 1, logs: 1 });
});

test('compatibility adoption also stops conditioned duplicates, stale identities and deferred work', async () => {
  const row = await candidate();
  await db.query("insert into casts(actor_id,play_id,role_name,cast_group) values($1,$2,'役A※声','日替わりゲスト')", [actorId, playId]);
  await assert.rejects(acceptCandidateWithHistory(legacyClient(), row, row.source_role_raw), /既存配役/);
  await assert.rejects(acceptCandidateWithHistory(legacyClient(), { ...row, matched_actor_id: otherActorId }, row.source_role_raw), /照合先/);
  await db.query("update external_cast_candidates set status='needs_review' where id=$1", [row.id]);
  await assert.rejects(acceptCandidateWithHistory(legacyClient(), row, row.source_role_raw), /未処理/);
  assert.deepEqual(await counts(), { casts: 1, logs: 0 });
});

test('compatibility log failure reports partial completion rather than a full success', async () => {
  const row = await candidate();
  await db.exec("create function test_reject_log() returns trigger language plpgsql as $$ begin raise exception 'test log failure'; end $$; create trigger test_fail_log before insert on external_import_logs for each row execute function test_reject_log();");
  try {
    const result = await acceptCandidateWithHistory(legacyClient(), row, row.source_role_raw);
    assert.equal(result.history_saved, false); assert.equal(result.atomic, false);
    assert.deepEqual(await counts(), { casts: 1, logs: 0 });
    assert.equal((await db.query('select status from external_cast_candidates')).rows[0].status, 'accepted');
  } finally { await db.exec('drop trigger test_fail_log on external_import_logs; drop function test_reject_log()'); }
});

test('a real RPC failure never falls back to separate client writes', async () => {
  const row = await candidate();
  const client = { ...sqlClient(db), rpc: async () => ({ error: { code: 'P0001', message: 'log insert failed' } }) };
  await assert.rejects(acceptCandidateWithHistory(client, row, row.source_role_raw));
  assert.deepEqual(await counts(), { casts: 0, logs: 0 });
});
