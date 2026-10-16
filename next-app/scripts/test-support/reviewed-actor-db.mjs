import { createStageTestDb, readMigration, rpcSqlClient } from './stage-test-db.mjs';

export async function createReviewedActorDb() {
  const db = await createStageTestDb();
  await db.exec(`alter table public.actors
    add column slug text unique, add column kana text, add column name_en text,
    add column birthday date, add column height_cm integer, add column blood_type text,
    add column gender text, add column profile text, add column profile_en text,
    add column updated_at timestamptz default now();
    update public.actors set slug = 'fixture-' || id::text;
    alter table public.actors alter column name set not null, alter column slug set not null;`);
  for (const name of ['2026-10-16_atomic_accept_external_cast_candidate.sql', '2026-10-16_work_cast_candidate_fields.sql', '2026-10-16_reviewed_actor_registration.sql']) await db.exec(await readMigration(name));
  return db;
}

export function reviewedActorSqlClient(db) {
  const base = rpcSqlClient(db);
  return { ...base, async rpc(name, params) {
    if (name !== 'register_reviewed_work_actor') return base.rpc(name, params);
    try {
      const { rows } = await db.query('select public.register_reviewed_work_actor($1,$2,$3,$4::jsonb,$5::jsonb) as result',
        [params.p_candidate_id, params.p_expected_updated_at, params.p_request_key, JSON.stringify(params.p_actor), JSON.stringify(params.p_research)]);
      return { data: rows[0].result, error: null };
    } catch (error) { return { data: null, error }; }
  } };
}
