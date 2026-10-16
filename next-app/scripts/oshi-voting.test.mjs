import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { OSHI_POINTS, validOshiSelection, summarizeOshiResults } from '../lib/oshi-points.mjs';
import { issueVoterToken, verifyVoterToken, networkHash, sameOriginVote, VOTER_MAX_AGE } from '../lib/oshi-security.mjs';

const secret = 'local-unit-test-secret-with-more-than-32-characters';
const playA = '00000000-0000-4000-8000-000000000001';
const playB = '00000000-0000-4000-8000-000000000002';
const hash = (n) => Number(n).toString(16).padStart(64,'0');
const migration = await readFile(new URL('../../sql/2026-10-16_oshi_point_voting.sql', import.meta.url),'utf8');

test('fixed bilingual options and strict 1..3 unique choices', () => {
  assert.equal(OSHI_POINTS.length, 10);
  assert.ok(OSHI_POINTS.every((point) => point.ja && point.en));
  for (const input of [[],['cast','cast'],['cast','music','dance','story'],['unknown'],['cast',null],null,'cast']) assert.equal(validOshiSelection(input), false);
  assert.equal(validOshiSelection(['cast','music','story']),true);
});
test('signed identity rejects forgery, expiry and future tokens; stable across JP/EN', () => {
  const now = Date.now(); const token = issueVoterToken(secret, now);
  const voter = verifyVoterToken(token, secret, now);
  assert.match(voter,/^[a-f0-9]{64}$/);
  assert.equal(verifyVoterToken(token,secret,now+1000),voter);
  assert.equal(verifyVoterToken(token.replace('v1.','v1.a'),secret,now),null);
  assert.equal(verifyVoterToken(token,'wrong-secret',now),null);
  assert.equal(verifyVoterToken(token,secret,now+(VOTER_MAX_AGE+1)*1000),null);
  assert.equal(verifyVoterToken(token,secret,now-120000),null);
});
test('origin protection rejects missing, cross-site and sibling-origin requests', () => {
  const request=(origin,site='same-origin')=>new Request('https://stageconnect.jp/api/vote',{headers:{...(origin?{origin}:{}),'sec-fetch-site':site}});
  assert.equal(sameOriginVote(request('https://stageconnect.jp')),true);
  assert.equal(sameOriginVote(request(null)),false);
  assert.equal(sameOriginVote(request('https://evil.example')),false);
  assert.equal(sameOriginVote(request('https://stageconnect.jp','cross-site')),false);
  assert.equal(sameOriginVote(new Request('http://localhost:8139/api/vote',{headers:{host:'127.0.0.1:8139',origin:'http://127.0.0.1:8139'}})),true);
});
test('network hashes use trusted Vercel input only, expire daily and group IPv6 privacy addresses', () => {
  const options={vercel:true,production:true,now:Date.parse('2026-10-16T10:00:00Z')};
  const h=new Headers({'x-forwarded-for':'1.2.3.4'});
  assert.equal(networkHash(h,secret,options),null);
  h.set('x-vercel-forwarded-for','1.2.3.4');
  const first=networkHash(h,secret,options); assert.match(first,/^[a-f0-9]{64}$/);
  h.set('x-vercel-forwarded-for','::ffff:1.2.3.4'); assert.equal(networkHash(h,secret,options),first);
  h.set('x-vercel-forwarded-for','1.2.3.4');
  assert.notEqual(first,networkHash(h,secret,{...options,now:options.now+86400000}));
  assert.equal(networkHash(h,secret,{...options,vercel:false}),null);
  h.set('x-vercel-forwarded-for','2001:db8:abc:1234::1'); const a=networkHash(h,secret,options);
  h.set('x-vercel-forwarded-for','2001:db8:abc:1234:1111:2222:3333:4444'); assert.equal(networkHash(h,secret,options),a);
});

async function createDb() {
  const db=await PGlite.create();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    grant usage on schema public to anon,authenticated,service_role;
    create table public.plays(id uuid primary key,slug text unique);
    insert into public.plays values('${playA}','production-a'),('${playB}','production-b');
    grant select on public.plays to service_role;`);
  await db.exec(migration); return db;
}
const submit=(db,play=playA,voter=1,points=['music'],network=100)=>db.query('select public.submit_oshi_ballot($1,$2,$3,$4::text[])',[play,hash(voter),hash(network),points]);
const results=async(db,play=playA)=>(await db.query('select * from public.get_oshi_results($1)',[play])).rows;
test('migration stores all choices, replaces a ballot atomically, keeps one participant and original timestamp', async () => {
  const db=await createDb();
  try {
    assert.deepEqual((await db.query('select id,name_ja,name_en from public.oshi_points order by sort_order')).rows,
      OSHI_POINTS.map(point=>({id:point.id,name_ja:point.ja,name_en:point.en})));
    await db.exec('set role service_role');
    await submit(db,playA,1,['cast','music','dance']);
    const created=(await db.query('select created_at from public.oshi_ballots')).rows[0].created_at;
    await db.exec("update public.oshi_ballots set updated_at = now()-interval '4 seconds'");
    await submit(db,playA,1,['action','story']);
    const ballot=(await db.query('select * from public.oshi_ballots')).rows;
    assert.equal(ballot.length,1); assert.deepEqual(ballot[0].point_ids,['action','story']); assert.deepEqual(ballot[0].created_at,created);
    const rows=await results(db); assert.equal(rows.length,10); assert.equal(Number(rows.find(r=>r.point_id==='music').votes),0);
    assert.equal(Number(rows.find(r=>r.point_id==='action').votes),1); assert.equal(Number(rows[0].participants),1);
    assert.equal((await db.query('select count(*) from public.oshi_ballots')).rows[0].count,1);
  } finally {await db.close();}
});
test('database rejects invalid arrays and unknown plays even when client checks are bypassed', async () => {
  const db=await createDb();
  try {
    for (const points of [[],null,['cast',null],['cast','cast'],['unknown'],['cast','dance','music','action']]) {
      await assert.rejects(submit(db,playA,1,points),/invalid_ballot/);
      if(points!==null) await assert.rejects(db.query('insert into public.oshi_ballots values($1,$2,$3)',[playA,hash(1),points]),/check constraint/);
    }
    await assert.rejects(submit(db,'00000000-0000-4000-8000-000000000009'),/play_not_found/);
    assert.equal((await db.query('select count(*) from public.oshi_ballots')).rows[0].count,0);
  } finally {await db.close();}
});
test('rate limit blocks fresh-cookie flooding on one network and rapid resubmission; failures do not add votes', async () => {
  const db=await createDb();
  try {
    await submit(db);
    await assert.rejects(submit(db),/vote_rate_limited/);
    for(let n=2;n<=10;n++) await submit(db,playA,n,['music']);
    await assert.rejects(submit(db,playA,11,['cast']),/vote_rate_limited/);
    assert.equal((await db.query('select count(*) from public.oshi_ballots')).rows[0].count,10);
    assert.equal((await results(db)).find(r=>r.point_id==='cast').votes,0);
  } finally {await db.close();}
});
test('RLS hides raw identities; anonymous users can read aggregates but cannot submit or change counts', async () => {
  const db=await createDb();
  try {
    await submit(db);
    for(const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from public.oshi_ballots'),/permission denied/);
      await assert.rejects(db.query('select * from public.oshi_vote_limits'),/permission denied/);
      await assert.rejects(submit(db),/permission denied/);
      await assert.rejects(db.query("update public.oshi_points set name_ja='changed'"),/permission denied/);
      const rows=await results(db); assert.equal(Number(rows[0].participants),1);
      assert.deepEqual(Object.keys(rows[0]).sort(),['participants','point_id','votes']);
      await db.exec('reset role');
    }
  } finally {await db.close();}
});
test('discovery excludes small samples, uses support per participant, and retains lower-ranked points', async () => {
  const db=await createDb();
  try {
    for(let n=1;n<=4;n++) await submit(db,playA,n,['cast','music','dance'],200+n);
    for(let n=1;n<=5;n++) await submit(db,playB,n,n===5?['story']:['music','story'],300+n);
    let discovery=(await db.query("select * from public.discover_oshi_plays('music')")).rows;
    assert.deepEqual(discovery.map(r=>r.play_slug),['production-b']);
    await submit(db,playA,5,['cast','music','action'],205);
    discovery=(await db.query("select * from public.discover_oshi_plays('music')")).rows;
    assert.deepEqual(discovery.map(r=>r.play_slug),['production-a','production-b']);
    const summary=summarizeOshiResults(await results(db));
    assert.equal(summary.participants,5); assert.equal(summary.top.length,3);
    assert.equal(summary.points.find(r=>r.id==='action').votes,1);
    assert.equal(summary.points.find(r=>r.id==='cast').support,100);
    assert.ok(summary.points.reduce((n,r)=>n+r.support,0)>100);
    assert.equal((await db.query("select * from public.discover_oshi_plays('invalid')")).rows.length,0);
    assert.equal((await db.query("select * from public.discover_oshi_plays('music',1)")).rows[0].play_slug,'production-b');
  } finally {await db.close();}
});
