// End-to-end local proof: captured source -> candidates -> sourced actors -> casts.
// No environment, credentials, Supabase client or network operations are used.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { buildWorkImportPlan } from '../lib/work-import-plan.mjs';
import { buildActorResearch, ACTOR_FACT_FIELDS } from '../lib/actor-research.mjs';
import { registerReviewedActor } from '../lib/register-reviewed-actor.mjs';
import { stageWorkCandidates } from '../lib/stage-work-candidates.mjs';
import { acceptCandidateWithHistory } from '../lib/accept-external-candidate.mjs';
import { createReviewedActorDb, reviewedActorSqlClient } from './test-support/reviewed-actor-db.mjs';
const flag=(name)=>process.argv.find((arg)=>arg.startsWith(`--${name}=`))?.slice(name.length+3);
const required=['source-file','review','research','slugs','snapshot-dir','output-dir'];
if(required.some((name)=>!flag(name)) || process.argv.slice(2).some((arg)=>!required.some((name)=>arg.startsWith(`--${name}=`)))) throw new Error('Use --source-file=<source> --review=<work decisions> --research=<actor research> --slugs=<URL decisions> --snapshot-dir=<snapshot> --output-dir=<private evidence>');
const json=async(path)=>JSON.parse(await readFile(resolve(path),'utf8'));
const manifest=await json(join(flag('snapshot-dir'),'manifest.json'));
const snapshot=Object.fromEntries(await Promise.all(['actors','plays','casts'].map(async(table)=>{
  const raw=await readFile(resolve(flag('snapshot-dir'),`${table}.json`),'utf8'); const rows=JSON.parse(raw);
  if(manifest.tables?.[table]?.sha256!==createHash('sha256').update(raw).digest('hex') || manifest.tables[table].count!==rows.length || new Set(rows.map((row)=>row.id)).size!==rows.length) throw new Error(`Invalid snapshot: ${table}`);
  return [table,rows];
})));
const plan=buildWorkImportPlan({source:await json(flag('source-file')),snapshot,review:await json(flag('review'))});
const report=buildActorResearch({plan,actors:snapshot.actors,research:await json(flag('research'))});
const slugs=await json(flag('slugs'));
assert.equal(slugs.sourceUrl,plan.source.url);
const db=await createReviewedActorDb();
try{
  await db.exec('truncate actors,plays,casts,actor_identity_sources,external_cast_candidates,external_import_logs cascade');
  await db.query(`insert into actors(id,name,slug,kana,name_en,birthday,height_cm,blood_type,gender,profile,profile_en,updated_at)
    select id,name,slug,kana,name_en,birthday,height_cm,blood_type,gender,profile,profile_en,updated_at from jsonb_to_recordset($1::jsonb)
    as x(id uuid,name text,slug text,kana text,name_en text,birthday date,height_cm int,blood_type text,gender text,profile text,profile_en text,updated_at timestamptz)`,[JSON.stringify(snapshot.actors)]);
  await db.query('insert into plays(id,title) select id,title from jsonb_to_recordset($1::jsonb) as x(id uuid,title text)',[JSON.stringify(snapshot.plays)]);
  const originalCasts=snapshot.casts.filter((row)=>row.play_id===plan.play.id);
  await db.query(`insert into casts(id,actor_id,play_id,role_name,cast_group,billing_order,is_starring,created_at,updated_at)
    select id,actor_id,play_id,role_name,cast_group,billing_order,is_starring,created_at,updated_at from jsonb_to_recordset($1::jsonb)
    as x(id uuid,actor_id uuid,play_id uuid,role_name text,cast_group text,billing_order int,is_starring boolean,created_at timestamptz,updated_at timestamptz)`,[JSON.stringify(originalCasts)]);
  const savedActors=async()=>(await db.query('select to_jsonb(a) as row from actors a order by id')).rows.map((item)=>item.row);
  const savedCasts=async()=>(await db.query('select to_jsonb(c) as row from casts c order by id')).rows.map((item)=>item.row);
  const beforeActors=await savedActors(); const beforeCasts=await savedCasts();
  const client=reviewedActorSqlClient(db);
  await stageWorkCandidates(client,plan,{write:true});
  const candidates=async()=>(await db.query('select * from external_cast_candidates order by source_order')).rows;
  const initialCandidates=await candidates(); const registrations=[]; const intents=[];
  for(const slugDecision of slugs.actors){
    const row=report.rows.find((item)=>item.sourceCreditKey===slugDecision.sourceCreditKey);
    const candidate=initialCandidates.find((item)=>item.source_credit_key===row.sourceCreditKey);
    const input={report,row,candidate,slugDecision}; intents.push(input);
    const result=await registerReviewedActor(client,input,{write:true}); registrations.push(result);
    for(const field of ACTOR_FACT_FIELDS) assert.equal(result.actor[field],row.profileDraft[field]);
    assert.equal(result.actor.profile,null); assert.equal(result.actor.profile_en,null);
  }
  const adoption=[];
  for(const candidate of await candidates()) if(candidate.matched_actor_id && candidate.matched_play_id && candidate.status==='pending') adoption.push(await acceptCandidateWithHistory(client,candidate,candidate.source_role_raw));
  const beforeRepeat={actors:await savedActors(),casts:await savedCasts(),candidates:await candidates(),logs:(await db.query('select * from external_import_logs order by id')).rows};
  for(const input of intents){const result=await registerReviewedActor(client,input,{write:true}); assert.equal(result.already_registered,true);}
  await stageWorkCandidates(client,plan,{write:true});
  for(const candidate of await candidates()) if(candidate.status==='accepted') await acceptCandidateWithHistory(client,candidate,candidate.source_role_raw);
  const afterActors=await savedActors(); const afterCasts=await savedCasts(); const afterCandidates=await candidates();
  const logs=(await db.query('select * from external_import_logs order by id')).rows;
  assert.deepEqual({actors:afterActors,casts:afterCasts,candidates:afterCandidates,logs},beforeRepeat);
  const originalIds=new Set(beforeActors.map((row)=>row.id));
  assert.deepEqual(afterActors.filter((row)=>originalIds.has(row.id)),beforeActors);
  for(const cast of beforeCasts) assert.deepEqual(afterCasts.find((row)=>row.id===cast.id),cast);
  for(const candidate of afterCandidates){
    const source=plan.rows.find((row)=>row.id===candidate.source_credit_key);
    assert.equal(candidate.source_actor_url,source.source.sourceActorUrl??null);
    assert.equal(candidate.source_cast_group,source.source.cast_group??null);
    if(candidate.status==='accepted'){
      const cast=afterCasts.find((row)=>row.id===candidate.accepted_cast_id);
      assert.equal(cast.role_name,source.source.role_name??null); assert.equal(cast.cast_group,source.source.cast_group??null);
      if(!source.existingCast) assert.equal(cast.billing_order,null);
    }
  }
  assert.equal(registrations.filter((row)=>row.actor_created).length,slugs.actors.length);
  assert.equal(afterActors.length,beforeActors.length+slugs.actors.length);
  assert.equal(afterCandidates.filter((row)=>row.status==='accepted').length,plan.counts.keep+plan.counts.add_cast+slugs.actors.length);
  const summary={mode:'offline_only',liveDatabaseWrites:0,staged:afterCandidates.length,
    originalActorsPreserved:beforeActors.length,actorsCreated:registrations.filter((row)=>row.actor_created).length,
    researchProfileConnections:report.counts.profileLinked,researchConfirmedFacts:report.counts.confirmedFacts,
    sourcedFacts:registrations.reduce((count,result)=>count+ACTOR_FACT_FIELDS.filter((field)=>result.actor[field]!==null).length,0),
    accepted:adoption.length,newCasts:adoption.filter((row)=>row.cast_created).length,
    existingCastsKept:originalCasts.length,unresolvedActors:afterCandidates.filter((row)=>!row.matched_actor_id).length,
    repeatAddedActors:0,repeatAddedCasts:0,repeatAddedLogs:0};
  const output=resolve(flag('output-dir'));await mkdir(output,{recursive:true});
  await writeFile(join(output,'offline-reviewed-actors.json'),JSON.stringify({summary,registrations,actors:afterActors.filter((row)=>!originalIds.has(row.id)),candidates:afterCandidates,casts:afterCasts,logs},null,2));
  console.log(JSON.stringify(summary,null,2));
}finally{await db.close();}
