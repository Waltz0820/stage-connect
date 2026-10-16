import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { refreshExternalRow } from '../lib/external-refresh.mjs';
import { createStageTestDb, sqlClient, actorId, otherActorId, playId, otherPlayId } from './test-support/stage-test-db.mjs';
let db;
before(async () => { db = await createStageTestDb(); });
after(async () => { await db?.close(); });
beforeEach(async () => { await db.exec('truncate external_cast_candidates, external_actors, external_plays cascade'); });
const now = () => new Date().toISOString();
const actor = () => ({ source: 'kira-hai', source_actor_name: '原名', source_actor_url: 'https://kira-hai.net/actor', matched_actor_id: actorId, match_status: 'matched', match_confidence: 90, scraped_at: now(), updated_at: now() });
const identity = (row) => ({ source: row.source, source_actor_url: row.source_actor_url });

test('refreshing a manual actor match keeps its ID, confidence, aliases and note', async () => {
  const client = sqlClient(db); const input = actor();
  const created = await refreshExternalRow(client, 'external_actors', input, identity(input));
  await db.query("update external_actors set matched_actor_id=$1,match_status='matched',match_confidence=85,alias_to='手動の別名',note='確認済み' where id=$2", [otherActorId, created.id]);
  const refreshed = await refreshExternalRow(client, 'external_actors', { ...input, source_actor_kana: 'よみ', alias_to: '自動の別名', note: '自動メモ' }, identity(input));
  assert.equal(refreshed.matched_actor_id, otherActorId);
  assert.equal(refreshed.match_confidence, 85);
  assert.equal(refreshed.alias_to, '手動の別名');
  assert.equal(refreshed.note, '確認済み');
  assert.equal(refreshed.source_actor_kana, 'よみ');
});

test('previously unmatched actors can be matched but ignored actors remain ignored', async () => {
  const client = sqlClient(db); const input = actor();
  const created = await refreshExternalRow(client, 'external_actors', { ...input, matched_actor_id: null, match_status: 'unmatched', match_confidence: 0 }, identity(input));
  const matched = await refreshExternalRow(client, 'external_actors', input, identity(input));
  assert.equal(matched.matched_actor_id, actorId);
  await db.query("update external_actors set matched_actor_id=null,match_status='ignored' where id=$1", [created.id]);
  const ignored = await refreshExternalRow(client, 'external_actors', input, identity(input));
  assert.equal(ignored.matched_actor_id, null);
  assert.equal(ignored.match_status, 'ignored');
});

test('a manual work unlink and an existing schedule survive empty/no detail refresh', async () => {
  const client = sqlClient(db);
  const input = { source: 'kira-hai', source_work_title_raw: '作品', source_work_url: 'https://kira-hai.net/work', matched_play_id: null, match_status: 'unmatched_manual', match_confidence: 0, source_period_text: '東京: 2020/01/01-01/03', source_schedule_items: [{ source_line: '元の日程' }], scraped_at: now(), updated_at: now() };
  const key = { source: input.source, source_work_url: input.source_work_url };
  await refreshExternalRow(client, 'external_plays', input, key);
  const result = await refreshExternalRow(client, 'external_plays', { ...input, matched_play_id: playId, match_status: 'matched', source_period_text: null, source_schedule_items: [] }, key);
  assert.equal(result.matched_play_id, null);
  assert.equal(result.match_status, 'unmatched_manual');
  assert.equal(result.source_period_text, input.source_period_text);
  assert.deepEqual(result.source_schedule_items, input.source_schedule_items);
});

test('accepted, rejected, deferred, and pending manual candidate IDs remain stable', async () => {
  const client = sqlClient(db);
  for (const status of ['accepted', 'rejected', 'needs_review', 'pending']) {
    const input = { source: 'kira-hai', source_actor_name: '俳優', source_actor_url: `https://kira-hai.net/${status}`, source_work_title: '作品', source_year: null, source_role_raw: '役※声', source_role_names: ['役※声'], matched_actor_id: otherActorId, matched_play_id: otherPlayId, status, confidence: 85, note: '手動判断', scraped_at: now(), updated_at: now() };
    const key = { source: input.source, source_actor_url: input.source_actor_url, source_work_title: input.source_work_title, source_year: null, source_role_raw: input.source_role_raw };
    const created = await refreshExternalRow(client, 'external_cast_candidates', input, key);
    const result = await refreshExternalRow(client, 'external_cast_candidates', { ...input, status: 'pending', matched_actor_id: actorId, matched_play_id: playId, confidence: 90 }, key);
    assert.equal(result.id, created.id); assert.equal(result.status, status);
    assert.equal(result.matched_actor_id, otherActorId); assert.equal(result.matched_play_id, otherPlayId);
    assert.equal(result.confidence, 85); assert.equal(result.note, '手動判断');
  }
});

test('a concurrent manual match wins over the importer, including editors not updating the timestamp', async () => {
  const input = actor(); const key = identity(input);
  const created = await refreshExternalRow(sqlClient(db), 'external_actors', { ...input, matched_actor_id: null, match_status: 'unmatched', match_confidence: 0 }, key);
  let edited = false;
  const client = sqlClient(db, { beforeUpdate: async () => {
    if (!edited) { edited = true; await db.query("update external_actors set matched_actor_id=$1,match_status='matched_manual',match_confidence=85 where id=$2", [otherActorId, created.id]); }
  } });
  const result = await refreshExternalRow(client, 'external_actors', input, key);
  assert.equal(result.matched_actor_id, otherActorId);
  assert.equal(result.match_status, 'matched_manual');
});

test('a conflicting new insert is re-read instead of duplicating or overwriting a manual decision', async () => {
  let inserted = false; const input = actor();
  const client = sqlClient(db, { beforeInsert: async () => {
    if (!inserted) { inserted = true; await db.query("insert into external_actors(source_actor_name,source_actor_url,matched_actor_id,match_status) values('競合が登録','https://kira-hai.net/actor',$1,'matched_manual')", [otherActorId]); }
  } });
  const result = await refreshExternalRow(client, 'external_actors', input, identity(input));
  assert.equal(result.matched_actor_id, otherActorId);
  assert.equal((await db.query('select count(*)::int as n from external_actors')).rows[0].n, 1);
});

test('continuous editing stops the refresh after bounded retries', async () => {
  const input = actor(); await refreshExternalRow(sqlClient(db), 'external_actors', input, identity(input));
  const client = sqlClient(db, { beforeUpdate: () => db.exec("update external_actors set note=coalesce(note,'') || '手動編集'") });
  await assert.rejects(refreshExternalRow(client, 'external_actors', { ...input, source_actor_kana: '自動更新' }, identity(input)), /Concurrent review/);
  assert.equal((await db.query('select source_actor_kana from external_actors')).rows[0].source_actor_kana, null);
});
