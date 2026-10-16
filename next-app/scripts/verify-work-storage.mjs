// Offline execution of a real work plan through the actual candidate SQL/RPCs.
// This imports only the minimal test schema, never credentials or a network client.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { createStageTestDb, readMigration, rpcSqlClient } from './test-support/stage-test-db.mjs';
import { stageWorkCandidates } from '../lib/stage-work-candidates.mjs';
import { acceptCandidateWithHistory } from '../lib/accept-external-candidate.mjs';
const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
if (!flag('plan') || !flag('snapshot-dir') || !flag('output-dir')) throw new Error('Use --plan=<work-import-plan.json> --snapshot-dir=<snapshot> --output-dir=<private evidence>');
const json = async (file) => JSON.parse(await readFile(resolve(file), 'utf8'));
const plan = await json(flag('plan'));
const directory = resolve(flag('snapshot-dir'));
const actors = await json(join(directory, 'actors.json'));
const plays = await json(join(directory, 'plays.json'));
const casts = (await json(join(directory, 'casts.json'))).filter((row) => row.play_id === plan.play.id);
const db = await createStageTestDb();
try {
  await db.exec(await readMigration('2026-10-16_atomic_accept_external_cast_candidate.sql'));
  await db.exec(await readMigration('2026-10-16_work_cast_candidate_fields.sql'));
  await db.exec('truncate actors,plays,casts,external_cast_candidates cascade');
  await db.query('insert into actors(id,name) select id,name from jsonb_to_recordset($1::jsonb) as x(id uuid,name text)', [JSON.stringify(actors)]);
  await db.query('insert into plays(id,title) select id,title from jsonb_to_recordset($1::jsonb) as x(id uuid,title text)', [JSON.stringify(plays)]);
  await db.query(`insert into casts(id,actor_id,play_id,role_name,cast_group,billing_order,is_starring,created_at,updated_at)
    select id,actor_id,play_id,role_name,cast_group,billing_order,is_starring,created_at,updated_at from jsonb_to_recordset($1::jsonb)
    as x(id uuid,actor_id uuid,play_id uuid,role_name text,cast_group text,billing_order integer,is_starring boolean,created_at timestamptz,updated_at timestamptz)`, [JSON.stringify(casts)]);
  const client = rpcSqlClient(db);
  const first = await stageWorkCandidates(client, plan, { write: true });
  const getCandidates = async () => (await db.query('select * from external_cast_candidates order by source_order')).rows;
  const adoption = [];
  for (const row of await getCandidates()) {
    if (row.matched_actor_id && row.matched_play_id && row.status === 'pending') {
      adoption.push({ candidateId: row.id, sourceActor: row.source_actor_name,
        ...await acceptCandidateWithHistory(client, row, row.source_role_raw) });
    }
  }
  const repeat = await stageWorkCandidates(client, plan, { write: true });
  const candidates = await getCandidates();
  const savedCasts = (await db.query('select * from casts order by id')).rows;
  const logs = (await db.query('select * from external_import_logs order by created_at')).rows;
  assert.equal(candidates.length, plan.rows.length);
  assert.equal(repeat.created, 0);
  assert.equal(savedCasts.length, casts.length + plan.counts.add_cast);
  assert.equal((await db.query('select count(*)::int as count from actors')).rows[0].count, actors.length);
  for (const row of plan.rows) {
    const candidate = candidates.find((item) => item.source_credit_key === row.id);
    assert.equal(candidate.source_actor_url, row.source.sourceActorUrl ?? null);
    assert.equal(candidate.source_role_raw, row.source.role_name ?? null);
    assert.equal(candidate.source_cast_group, row.source.cast_group ?? null);
    assert.equal(candidate.source_order, row.sourceOrder);
    if (candidate.status === 'accepted') {
      const cast = savedCasts.find((item) => item.id === candidate.accepted_cast_id);
      assert.equal(cast.cast_group, row.source.cast_group ?? null);
      if (row.existingCast) assert.equal(cast.id, row.existingCast.id);
      await acceptCandidateWithHistory(client, candidate, candidate.source_role_raw);
    } else assert.equal(candidate.matched_actor_id, null);
  }
  assert.equal((await db.query('select count(*)::int as count from external_import_logs')).rows[0].count, logs.length);
  const report = { mode: 'offline_only', liveDatabaseWrites: 0, scope: 'Minimal PostgreSQL test schema with snapshot actors/plays and target-work casts',
    sourceUrl: plan.source.url, staged: first.created, repeatCreated: repeat.created,
    withoutActorPage: candidates.filter((row) => !row.source_actor_url).length,
    ensembleCandidates: candidates.filter((row) => row.source_cast_group === 'アンサンブル').length,
    accepted: adoption.length, newCasts: adoption.filter((row) => row.cast_created).length,
    existingCastsKept: adoption.filter((row) => !row.cast_created).length,
    actorsCreated: 0, unresolvedActors: candidates.filter((row) => !row.matched_actor_id).length, logCount: logs.length,
    candidates, casts: savedCasts, adoption, logs };
  const output = resolve(flag('output-dir')); await mkdir(output, { recursive: true });
  await writeFile(join(output, 'offline-work-storage.json'), JSON.stringify(report, null, 2));
  const { candidates: _candidates, casts: _casts, adoption: _adoption, logs: _logs, ...summary } = report;
  console.log(JSON.stringify(summary, null, 2));
} finally { await db.close(); }
