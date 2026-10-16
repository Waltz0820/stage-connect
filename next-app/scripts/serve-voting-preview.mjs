// Isolated browser/API test harness. Only GET/HEAD requests may reach the real public DB.
// All voting writes run in an in-memory PostgreSQL database that disappears on exit.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const env = Object.fromEntries((await readFile(new URL('../.env.local',import.meta.url),'utf8')).split(/\r?\n/)
  .filter(line=>/^\w+=/.test(line)).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1).replace(/^['"]|['"]$/g,'')];}));
const remote=env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const anon=env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
if(!remote || !anon) throw new Error('Public Supabase environment required');
const db=await PGlite.create();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
  grant usage on schema public to anon,authenticated,service_role;
  create table public.plays(id uuid primary key,slug text unique);
  grant select on public.plays to service_role;`);
await db.exec(await readFile(new URL('../../sql/2026-10-16_oshi_point_voting.sql',import.meta.url),'utf8'));
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value,(_,v)=>typeof v==='bigint'?Number(v):v));};
const safeTables=new Set(['actors','plays','casts','franchises','tags','play_tags','play_schedules','editorials','tag_play_counts','watch_dmm_franchises']);
let writes=0;
const server=http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:8139');
  res.setHeader('Access-Control-Allow-Headers','apikey,authorization,content-type,x-client-info,prefer');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  const url=new URL(req.url,'http://127.0.0.1:8142');
  try {
    if(url.pathname.startsWith('/rest/v1/rpc/')){
      let body='';for await(const chunk of req) {body+=chunk;if(body.length>4096)throw new Error('Body too large');}
      const p=JSON.parse(body||'{}'); const fn=url.pathname.split('/').pop();
      if(req.method!=='POST')return json(res,405,{message:'POST required'});
      if(fn==='get_oshi_results')return json(res,200,(await db.query('select * from public.get_oshi_results($1)',[p.p_play_id])).rows);
      if(fn==='discover_oshi_plays')return json(res,200,(await db.query('select * from public.discover_oshi_plays($1,$2)',[p.p_point_id,p.p_offset??0])).rows);
      if(fn==='submit_oshi_ballot' && req.headers.apikey==='local-voting-service'){
        await db.query('select public.submit_oshi_ballot($1,$2,$3,$4::text[])',[p.p_play_id,p.p_voter_hash,p.p_network_hash,p.p_points]);
        writes++; return json(res,200,null);
      }
      return json(res,403,{message:'No upstream RPCs allowed'});
    }
    if(url.pathname==='/rest/v1/oshi_ballots'){
      if(req.method!=='GET' || req.headers.apikey!=='local-voting-service')return json(res,403,{message:'Forbidden'});
      const play=url.searchParams.get('play_id')?.replace(/^eq\./,'');const voter=url.searchParams.get('voter_hash')?.replace(/^eq\./,'');
      const rows=(await db.query('select point_ids from public.oshi_ballots where play_id=$1 and voter_hash=$2',[play,voter])).rows;
      return json(res,200,rows);
    }
    if(url.pathname==='/local-test-status' && req.method==='GET')return json(res,200,{localWrites:writes,liveWrites:0,ballots:(await db.query('select play_id,point_ids from public.oshi_ballots')).rows});
    const table=url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1];
    if(!safeTables.has(table) || !['GET','HEAD'].includes(req.method))return json(res,403,{message:'Read-only upstream'});
    const headers={apikey:anon,Authorization:`Bearer ${anon}`};
    for(const name of ['accept','range','range-unit','prefer'])if(req.headers[name])headers[name]=req.headers[name];
    const upstream=await fetch(remote+url.pathname+url.search,{method:req.method,headers});
    const data=await upstream.text();
    // Mirror only IDs/slugs, so the local voting foreign key references real public productions.
    if(table==='plays' && upstream.ok && data){
      const parsed=JSON.parse(data);
      for(const row of (Array.isArray(parsed)?parsed:[parsed])) if(row.id)await db.query('insert into public.plays(id,slug) values($1,$2) on conflict(id) do update set slug=coalesce($3,plays.slug)',[row.id,row.slug??row.id,row.slug??null]);
    }
    for(const name of ['content-type','content-range','preference-applied']){const value=upstream.headers.get(name);if(value)res.setHeader(name,value);}
    res.writeHead(upstream.status);res.end(data);
  }catch(error){json(res,error.code==='P0001'?400:500,{message:error.message,code:error.code??'preview_error'});}
});
await new Promise(resolve=>server.listen(8142,'127.0.0.1',resolve));
console.log('Isolated voting DB: 8142; preview: http://127.0.0.1:8139; live writes: disabled');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--port','8139'],{
  cwd:new URL('..',import.meta.url),stdio:'inherit',env:{...process.env,
    NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:8142',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-voting-anon',
    SUPABASE_SERVICE_ROLE_KEY:'local-voting-service',OSHI_VOTER_SECRET:randomBytes(32).toString('hex'),VERCEL:'',},
});
const stop=()=>{child.kill();server.close();db.close();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);child.on('exit',()=>{server.close();db.close();});
