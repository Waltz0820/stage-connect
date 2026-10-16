import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { readAllRows } from '../lib/source-match.mjs';
import { buildWorkImportPlan } from '../lib/work-import-plan.mjs';
import { buildActorResearch } from '../lib/actor-research.mjs';
import { buildReviewedActorRegistration, registerReviewedActor } from '../lib/register-reviewed-actor.mjs';

const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const required = ['source-file','review','research','slugs','snapshot-dir','output-dir'];
const allowed = [...required,'candidates-file'];
const write = process.argv.includes('--write');
if (process.argv.slice(2).some((arg) => arg !== '--write' && !allowed.some((name) => arg.startsWith(`--${name}=`))) || required.some((name) => !flag(name)) ||
  write && flag('candidates-file') || !write && !flag('candidates-file')) throw new Error('Use --source-file=<parsed source> --review=<work decisions> --research=<actor research> --slugs=<reviewed URLs> --snapshot-dir=<original verified snapshot> --output-dir=<private evidence> [--candidates-file=<saved candidates> | --write]');
const json = async (path) => JSON.parse(await readFile(resolve(path),'utf8'));
const manifest = await json(join(flag('snapshot-dir'),'manifest.json'));
const snapshot = Object.fromEntries(await Promise.all(['actors','plays','casts'].map(async (table) => {
  const raw = await readFile(resolve(flag('snapshot-dir'),`${table}.json`),'utf8');
  const rows = JSON.parse(raw);
  if (manifest.tables?.[table]?.sha256 !== createHash('sha256').update(raw).digest('hex') || manifest.tables[table].count !== rows.length || new Set(rows.map((row)=>row.id)).size !== rows.length) throw new Error(`Incomplete or changed snapshot: ${table}`);
  return [table,rows];
})));
// Preserve the original reviewed occurrences across retries after actors exist.
// Live candidate versions/source fingerprints and SQL check the actual writes.
const plan = buildWorkImportPlan({source:await json(flag('source-file')),snapshot,review:await json(flag('review'))});
if (plan.blockers.length || plan.counts.hold) throw new Error('作品の照合を完了してから人物登録を準備してください。');
const research = await json(flag('research'));
const slugs = await json(flag('slugs'));
if (slugs.version !== 1 || slugs.sourceUrl !== plan.source.url || !Array.isArray(slugs.actors) || !slugs.actors.length || new Set(slugs.actors.map((row)=>row.sourceCreditKey)).size !== slugs.actors.length) throw new Error('登録用URLの判断が重複しているか、対象作品と一致しません。');
let client;
let actors = snapshot.actors;
let candidates;
if (write) {
  const directory = resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const env = {...process.env};
  for (const line of (await readFile(join(directory,'.env.local'),'utf8')).split(/\r?\n/u)) {
    const match=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/u);
    if(match && env[match[1]] === undefined) env[match[1]]=match[2].replace(/^(['"])(.*)\1$/u,'$2');
  }
  if(!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server credentials required; values are never logged.');
  client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  [actors,candidates]=await Promise.all([
    readAllRows(client,'actors','*'),
    readAllRows(client,'external_cast_candidates','*',{configure:(query)=>query.eq('source','kira-hai').eq('source_work_url',plan.source.url)}),
  ]);
} else {
  const saved = await json(flag('candidates-file'));
  candidates = Array.isArray(saved) ? saved : saved.candidates;
  if (!Array.isArray(candidates)) throw new Error('保存済みの配役候補が必要です。');
}
const report=buildActorResearch({plan,actors,research});
const jobs=slugs.actors.map((slugDecision)=>{
  const row=report.rows.find((item)=>item.sourceCreditKey===slugDecision.sourceCreditKey);
  const matches=candidates.filter((item)=>item.source_work_url===plan.source.url && item.source_credit_key===slugDecision.sourceCreditKey);
  if(matches.length!==1) throw new Error('保存済みの配役候補が一意に見つかりません。作品単位の候補保存を先に確認してください。');
  const input={report,row,candidate:matches[0],slugDecision};
  return {input,params:buildReviewedActorRegistration(input)};
});
const directory=resolve(flag('output-dir')); await mkdir(directory,{recursive:true});
const results=[];
for(const {input,params} of jobs){
  const path=join(directory,`register-actor-${params.p_request_key.slice(0,16)}-${Date.now()}.json`);
  const journal={checkedAt:new Date().toISOString(),state:write?'write_pending':'dry_run',params};
  await writeFile(path,JSON.stringify(journal,null,2),{flag:'wx'});
  try{
    const result=await registerReviewedActor(client,input,{write}); journal.state=result.status; journal.result=result;
    results.push({name:input.row.sourceActorName,status:result.status,actorCreated:result.actor_created??false,alreadyRegistered:result.already_registered??false,evidencePath:path});
  }catch(error){
    journal.error=error.message;
    if(error.code==='ACTOR_REGISTRATION_UNAVAILABLE') journal.state='not_registered';
    await writeFile(path,JSON.stringify(journal,null,2));
    console.error(JSON.stringify({state:journal.state,message:error.message,completed:results.length,evidencePath:path}));
    process.exitCode=1; break;
  }
  await writeFile(path,JSON.stringify(journal,null,2));
}
console.log(JSON.stringify({mode:write?'actor_registration':'offline_dry_run',planned:jobs.length,completed:results.length,
  created:results.filter((row)=>row.actorCreated).length,repeated:results.filter((row)=>row.alreadyRegistered).length,
  castCreates:0,results},null,2));
