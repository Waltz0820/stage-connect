import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewedActorRegistration, registerReviewedActor } from '../lib/register-reviewed-actor.mjs';
import { createReviewedActorDb, reviewedActorSqlClient } from './test-support/reviewed-actor-db.mjs';
import { readMigration, playId } from './test-support/stage-test-db.mjs';

let db, client;
before(async () => { db = await createReviewedActorDb(); client = reviewedActorSqlClient(db); });
after(async () => { await db?.close(); });
const evidence = [{ url: 'https://example.com/official', note: '本人の出演歴に当該公演と役の記載', checkedAt: '2026-10-16T10:17:01Z' }];
async function fixture() {
  await db.exec('truncate actors,casts,external_cast_candidates,actor_identity_sources,external_import_logs,external_actors cascade');
  const { rows: [candidate] } = await db.query(`insert into external_cast_candidates(source_actor_name,source_actor_url,source_work_title,source_work_url,
    source_role_raw,source_cast_group,source_credit_key,source_evidence,matched_play_id,status)
    values('確認済俳優',null,'作品A','https://kira-hai.net/work-a',null,'アンサンブル',$1,$2::jsonb,$3,'needs_review') returning *`, ['a'.repeat(20),JSON.stringify({ source_fingerprint: 'b'.repeat(64) }),playId]);
  const row = { sourceCreditKey: candidate.source_credit_key, sourceActorName: candidate.source_actor_name,
    sourceWorkUrl: candidate.source_work_url, sourceActorUrl: null, profileStatus: 'profile_linked', issues: [],
    identity: { status: 'profile_linked', profileUrl: 'https://example.com/actor-a', evidence }, appearanceEvidence: evidence,
    facts: { birthday: { status: 'confirmed', value: '1980-10-29', evidence } },
    profileDraft: { name: candidate.source_actor_name, birthday: '1980-10-29', name_en: null, kana: null, height_cm: null, blood_type: null, gender: null } };
  const report = { mode: 'research_only', sourceFingerprint: 'b'.repeat(64), researchFingerprint: 'c'.repeat(64), rows: [row] };
  return { report, row, candidate, slugDecision: { sourceCreditKey: row.sourceCreditKey, sourceActorName: row.sourceActorName, slug: 'verified-actor', reason: '確認済みのURL判断' } };
}
const count = async (table) => (await db.query(`select count(*)::int as n from ${table}`)).rows[0].n;

test('reviewed actor migration is repeatable and a dry run makes no RPC call', async () => {
  await db.exec(await readMigration('2026-10-16_reviewed_actor_registration.sql'));
  const result = await registerReviewedActor({ rpc() { throw new Error('unexpected call'); } }, await fixture());
  assert.equal(result.status,'dry_run'); assert.equal(await count('actors'),0);
});
test('actor creation, source identity, one candidate match and history commit together with unknowns null', async () => {
  const input = await fixture();
  const { rows: [other] } = await db.query(`insert into external_cast_candidates(source_actor_name,source_actor_url,source_work_title,source_work_url,source_role_raw,status)
    values('確認済俳優',null,'別作品','https://kira-hai.net/other','別役','needs_review') returning *`);
  const result = await registerReviewedActor(client,input,{write:true});
  assert.equal(result.actor_created,true); assert.equal(result.actor.birthday,'1980-10-29');
  for (const key of ['kana','name_en','height_cm','blood_type','gender','profile','profile_en']) assert.equal(result.actor[key],null);
  assert.equal(await count('actors'),1); assert.equal(await count('actor_identity_sources'),1); assert.equal(await count('external_import_logs'),1);
  const { rows: [saved] } = await db.query('select * from external_cast_candidates where id=$1',[input.candidate.id]);
  assert.equal(saved.matched_actor_id,result.actor.id); assert.equal(saved.status,'pending'); assert.equal(saved.source_cast_group,'アンサンブル');
  assert.deepEqual(saved.source_evidence.actor_research.facts,input.row.facts);
  assert.equal((await db.query('select matched_actor_id from external_cast_candidates where id=$1',[other.id])).rows[0].matched_actor_id,null);
});
test('retrying the same intent reuses the actor and history even after candidate adoption', async () => {
  const input = await fixture(); const first = await registerReviewedActor(client,input,{write:true});
  await db.query("update external_cast_candidates set status='accepted',updated_at=now() where id=$1",[input.candidate.id]);
  const retry = await registerReviewedActor(client,input,{write:true});
  assert.equal(retry.already_registered,true); assert.equal(retry.actor.id,first.actor.id);
  assert.equal(await count('actors'),1); assert.equal(await count('external_import_logs'),1);
  const changed = structuredClone(input); changed.slugDecision.slug='different-slug';
  await assert.rejects(()=>registerReviewedActor(client,changed,{write:true}),/candidate_changed|already_decided/u);
});
test('matching an actor and then editing its candidate cannot silently redirect a retry', async () => {
  const input = await fixture(); await registerReviewedActor(client,input,{write:true});
  await db.query('update external_cast_candidates set matched_actor_id=null where id=$1',[input.candidate.id]);
  await assert.rejects(()=>registerReviewedActor(client,input,{write:true}),/retry_conflict/u);
});
test('researching another actor does not change a completed registration intent', async () => {
  const input=await fixture(); const original=buildReviewedActorRegistration(input);
  await registerReviewedActor(client,input,{write:true});
  input.report.researchFingerprint='f'.repeat(64);
  assert.deepEqual(buildReviewedActorRegistration(input),original);
  assert.equal((await registerReviewedActor(client,input,{write:true})).already_registered,true);
  assert.equal(await count('actors'),1); assert.equal(await count('external_import_logs'),1);
});
test('a later credit with the same reviewed profile reuses the actor without profile overwrites', async () => {
  const input = await fixture(); const first = await registerReviewedActor(client,input,{write:true});
  await db.query("update actors set profile='手入力の補足' where id=$1",[first.actor.id]);
  const { rows:[candidate] } = await db.query(`insert into external_cast_candidates(source_actor_name,source_actor_url,source_work_title,source_work_url,
    source_role_raw,source_credit_key,source_evidence,status) values('確認済俳優',null,'別作品','https://kira-hai.net/other','別役',$1,$2::jsonb,'needs_review') returning *`,['d'.repeat(20),JSON.stringify({source_fingerprint:'e'.repeat(64)})]);
  const row = structuredClone(input.row); row.sourceCreditKey=candidate.source_credit_key; row.sourceWorkUrl=candidate.source_work_url;
  const report = {...input.report,sourceFingerprint:'e'.repeat(64),rows:[row]};
  row.issues=['existing_identity_candidates'];
  const next = { report,row,candidate,slugDecision:{...input.slugDecision,sourceCreditKey:row.sourceCreditKey} };
  const result=await registerReviewedActor(client,next,{write:true});
  assert.equal(result.actor_created,false); assert.equal(result.actor.id,first.actor.id); assert.equal(result.actor.profile,'手入力の補足');
  assert.equal(await count('actors'),1); assert.equal(await count('external_import_logs'),2);
  // Existing nonempty conflicting facts stop, rather than overwriting them.
  await db.query("update actors set birthday='1990-01-01' where id=$1",[first.actor.id]);
  await db.query('delete from external_import_logs where details->>\'candidate_id\'=$1',[candidate.id]);
  await db.query("update external_cast_candidates set matched_actor_id=null,status='needs_review' where id=$1",[candidate.id]);
  next.candidate=(await db.query('select * from external_cast_candidates where id=$1',[candidate.id])).rows[0];
  await assert.rejects(()=>registerReviewedActor(client,next,{write:true}),/fact_conflict/u);
});
test('a stale candidate or changed source cannot create an actor', async () => {
  for (const change of ["updated_at=now()+interval '1 second'","source_actor_name='別人'","source_credit_key='dddddddddddddddddddd'","source_evidence='{}'::jsonb","status='rejected'"]) {
    const input=await fixture(); await db.query(`update external_cast_candidates set ${change} where id=$1`,[input.candidate.id]);
    await assert.rejects(()=>registerReviewedActor(client,input,{write:true})); assert.equal(await count('actors'),0);
  }
});
test('name, reading and slug collisions do not cause automatic suffixes or duplicate actors', async () => {
  for (const existing of [
    {name:'確認済　俳優',slug:'other-slug'},
    {name:'別人',slug:'verified-actor'},
  ]) {
    const input=await fixture(); await db.query('insert into actors(name,slug) values($1,$2)',[existing.name,existing.slug]);
    await assert.rejects(()=>registerReviewedActor(client,input,{write:true}),/identity_review|slug_conflict/u);
    assert.equal(await count('actors'),1); assert.equal(await count('actor_identity_sources'),0); assert.equal(await count('external_import_logs'),0);
  }
});
test('an equal reading is a review candidate even when the kanji and URL differ', async () => {
  const input=await fixture(); input.row.profileDraft.kana='タクヤ';
  input.row.facts.kana={status:'confirmed',value:'タクヤ',evidence};
  await db.query("insert into actors(name,slug,kana) values('別の漢字','another-actor','タクヤ')");
  await assert.rejects(()=>registerReviewedActor(client,input,{write:true}),/identity_review/u);
  assert.equal(await count('actors'),1); assert.equal(await count('external_import_logs'),0);
});
test('a history failure rolls back actor, identity anchor and candidate match', async () => {
  const input=await fixture();
  await db.exec(`create function fail_actor_log() returns trigger language plpgsql as $$ begin raise exception 'history unavailable'; end; $$;
    create trigger fail_actor_log before insert on external_import_logs for each row execute function fail_actor_log();`);
  try {
    await assert.rejects(()=>registerReviewedActor(client,input,{write:true}),/history unavailable/u);
    assert.equal(await count('actors'),0); assert.equal(await count('actor_identity_sources'),0);
    assert.equal((await db.query('select matched_actor_id from external_cast_candidates')).rows[0].matched_actor_id,null);
  } finally { await db.exec('drop trigger fail_actor_log on external_import_logs; drop function fail_actor_log()'); }
});
test('a reviewed distinct person may share a reading, but stale or unsupported exclusions stop', async () => {
  for (const variation of ['verified','stale','no_evidence','same_birthday']) {
    const input=await fixture(); input.row.profileDraft.kana='タクヤ';
    input.row.facts.kana={status:'confirmed',value:'タクヤ',evidence};
    const {rows:[other]}=await db.query("insert into actors(name,slug,kana,birthday) values('別の漢字','takuya','タクヤ','1999-01-01') returning *");
    const distinction={actorId:other.id,expectedName:other.name,expectedBirthday:'1999-01-01',expectedUpdatedAt:other.updated_at.toISOString(),evidence};
    if(variation==='stale') distinction.expectedUpdatedAt='2020-01-01T00:00:00Z';
    if(variation==='no_evidence') distinction.evidence=[];
    if(variation==='same_birthday') { input.row.profileDraft.birthday='1999-01-01';input.row.facts.birthday.value='1999-01-01'; }
    input.row.distinctActors=[distinction];
    if(variation==='verified') {
      const result=await registerReviewedActor(client,input,{write:true});
      assert.notEqual(result.actor.id,other.id); assert.equal(await count('actors'),2);
      assert.equal((await db.query('select slug from actors where id=$1',[other.id])).rows[0].slug,'takuya');
    } else {
      await assert.rejects(()=>registerReviewedActor(client,input,{write:true}),/distinct_actor/u);
      assert.equal(await count('actors'),1); assert.equal(await count('external_import_logs'),0);
    }
  }
});
test('the SQL rejects unsourced fields, unlinked identity and invented prose even when bypassing JS', async () => {
  const input=await fixture(); const original=buildReviewedActorRegistration(input);
  for (const mutate of [
    (p)=>{p.p_actor.gender='male';},
    (p)=>{p.p_actor.profile='A long invented biography';},
    (p)=>{p.p_research.identity.status='appearance_only';},
    (p)=>{p.p_research.facts.birthday.evidence=[];},
    (p)=>{p.p_actor.birthday='2001-02-29';p.p_research.facts.birthday.value='2001-02-29';},
  ]) {
    const params=structuredClone(original); mutate(params); const {error}=await client.rpc('register_reviewed_work_actor',params);
    assert.ok(error); assert.equal(await count('actors'),0);
  }
});
test('missing RPC never falls back to separate actor/candidate writes', async () => {
  const input=await fixture(); let calls=0;
  await assert.rejects(()=>registerReviewedActor({async rpc(){calls++;return{error:{code:'PGRST202'}};}},input,{write:true}),{code:'ACTOR_REGISTRATION_UNAVAILABLE'});
  assert.equal(calls,1); assert.equal(await count('actors'),0);
});
test('existing candidate RLS blocks non-admins and anonymous RPC execution is denied', async () => {
  const input=await fixture();
  await db.exec(`set role authenticated; set request.jwt.claims='{"email":"viewer@example.com"}';`);
  try { await assert.rejects(()=>registerReviewedActor(client,input,{write:true}),/not_found_or_not_authorized/u); }
  finally { await db.exec('reset role'); }
  await db.exec('set role anon');
  try { const {error}=await client.rpc('register_reviewed_work_actor',buildReviewedActorRegistration(input)); assert.ok(error); }
  finally { await db.exec('reset role'); }
  assert.equal(await count('actors'),0);
});
test('an authorized admin can register through invoker rights without weakening table RLS', async () => {
  const input=await fixture();
  await db.exec(`set role authenticated; set request.jwt.claims='{"email":"butcher1629@gmail.com"}';`);
  try {
    const result=await registerReviewedActor(client,input,{write:true}); assert.equal(result.actor_created,true);
    const {rows:[acl]}=await db.query("select has_table_privilege('authenticated','public.actor_identity_sources','UPDATE') as can_update");
    assert.equal(acl.can_update,false);
  } finally {await db.exec('reset role');}
  assert.equal(await count('actors'),1);
});
