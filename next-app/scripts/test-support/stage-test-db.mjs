import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

export const actorId = '00000000-0000-4000-8000-000000000001';
export const otherActorId = '00000000-0000-4000-8000-000000000002';
export const playId = '00000000-0000-4000-8000-000000000003';
export const otherPlayId = '00000000-0000-4000-8000-000000000004';
export const readMigration = (name) => readFile(new URL(`../../../sql/${name}`, import.meta.url), 'utf8');
export async function createStageTestDb() {
  const db = await PGlite.create();
  await db.exec(`
    create role authenticated; create role service_role bypassrls; create role anon;
    create schema auth;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create table public.actors(id uuid primary key default gen_random_uuid(), name text);
    create table public.plays(id uuid primary key default gen_random_uuid(), title text);
    create table public.casts(id uuid primary key default gen_random_uuid(), actor_id uuid references actors(id),
      play_id uuid references plays(id), role_name text, cast_group text, is_starring boolean default false,
      billing_order integer, created_at timestamptz default now(), updated_at timestamptz default now());
    insert into actors(id,name) values('${actorId}','俳優A'),('${otherActorId}','俳優B');
    insert into plays(id,title) values('${playId}','作品A'),('${otherPlayId}','作品B');
  `);
  for (const name of ['2026-03-16_allow_multi_role_casts.sql', '2026-04-25_add_external_import_candidates.sql', '2026-04-25_add_external_actor_profile_candidates.sql', '2026-04-25_add_external_actor_kana_candidate.sql', '2026-04-27_add_external_import_logs.sql', '2026-04-28_add_external_play_schedule_candidates.sql']) {
    await db.exec(await readMigration(name));
  }
  await db.exec(`grant usage on schema public,auth to authenticated,service_role;
    grant select,insert,update,delete on all tables in schema public to authenticated,service_role;`);
  return db;
}

// Small Supabase-shaped adapter; persisted decisions are asserted against real SQL rows.
export function sqlClient(db, hooks = {}) {
  const ident = (value) => { if (!/^[a-z_]+$/u.test(value)) throw new Error('Invalid identifier'); return `"${value}"`; };
  return { from(table) {
    let operation = 'select'; let payload; const filters = [];
    const query = {
      select() { return query; },
      insert(value) { operation = 'insert'; payload = value; return query; },
      update(value) { operation = 'update'; payload = value; return query; },
      eq(field, value) { filters.push([field, value]); return query; },
      is(field, value) { filters.push([field, value]); return query; },
      async single() { return execute(true); },
      async maybeSingle() { return execute(false); },
      then(resolve, reject) { return execute(false, true).then(resolve, reject); },
    };
    async function execute(required, multiple = false) {
      try {
        if (operation === 'update') await hooks.beforeUpdate?.({ table, payload });
        if (operation === 'insert') await hooks.beforeInsert?.({ table, payload });
        const values = [];
        const bind = (value) => { values.push(value); return `$${values.length}`; };
        const fields = Object.entries(payload ?? {}).filter(([, value]) => value !== undefined);
        let sql = `select * from ${ident(table)}`;
        if (operation === 'insert') sql = `insert into ${ident(table)} (${fields.map(([field]) => ident(field)).join(',')}) values (${fields.map(([, value]) => bind(value)).join(',')})`;
        if (operation === 'update') sql = `update ${ident(table)} set ${fields.map(([field, value]) => `${ident(field)}=${bind(value)}`).join(',')}`;
        if (filters.length) sql += ` where ${filters.map(([field, value]) => value == null ? `${ident(field)} is null` : `${ident(field)}=${bind(value)}`).join(' and ')}`;
        if (operation !== 'select') sql += ' returning *';
        const { rows } = await db.query(sql, values);
        if (multiple) return { data: rows, error: null };
        if (rows.length > 1 || required && !rows.length) return { data: null, error: { code: 'PGRST116', message: 'Expected one row' } };
        return { data: rows[0] ?? null, error: null };
      } catch (error) { return { data: null, error }; }
    }
    return query;
  } };
}

// Executes the actual migrations' RPC functions in the local test database.
export function rpcSqlClient(db) {
  return { ...sqlClient(db), rpc: async (name, params) => {
    try {
      if (name === 'stage_external_work_cast_candidates') {
        const { rows } = await db.query('select public.stage_external_work_cast_candidates($1,$2,$3::jsonb) as result', [params.p_work_url, params.p_batch_key, JSON.stringify(params.p_items)]);
        return { data: rows[0].result, error: null };
      }
      if (!['accept_external_work_cast_candidate', 'accept_external_cast_candidate'].includes(name)) throw new Error('Unsupported local test RPC');
      const extended = name === 'accept_external_work_cast_candidate';
      const values = [params.p_candidate_id, params.p_expected_actor_id, params.p_expected_play_id, params.p_role_name];
      if (extended) values.push(params.p_expected_group, params.p_expected_updated_at);
      const { rows } = await db.query(`select * from public.${extended ? 'accept_external_work_cast_candidate' : 'accept_external_cast_candidate'}(${values.map((_, i) => `$${i + 1}`).join(',')})`, values);
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  } };
}
