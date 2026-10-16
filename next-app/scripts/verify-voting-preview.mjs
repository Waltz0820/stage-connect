// Run only with serve-voting-preview.mjs (all writes stay in its in-memory DB).
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
const base='http://127.0.0.1:8139';
const harness='http://127.0.0.1:8142';
const before=await(await fetch(harness+'/local-test-status')).json();
assert.equal(before.liveWrites,0);
const rows=await(await fetch(harness+'/rest/v1/plays?select=id,slug&slug=eq.kingdom-stage-2-keisho-2026')).json();
const endpoint=base+'/api/plays/'+rows[0].id+'/oshi';
const initial=await fetch(endpoint);assert.equal(initial.status,200);
const cookie=initial.headers.get('set-cookie').split(';')[0];
assert.match(initial.headers.get('set-cookie'),/HttpOnly/i);
assert.match(initial.headers.get('cache-control'),/no-store/);
const send=(points,extra={})=>fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie,...extra},body:JSON.stringify({points})});
assert.equal((await send(['music'],{Origin:'https://evil.example'})).status,403);
assert.equal((await send(['music'],{Cookie:''})).status,409);
for(const points of [[],['cast','cast'],['unknown'],['cast','music','dance','action']])assert.equal((await send(points)).status,400);
assert.equal((await send(['music'],{'Content-Type':'text/plain'})).status,415);
const huge=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie},body:JSON.stringify({points:['cast'],extra:'x'.repeat(1100)})});assert.equal(huge.status,413);
const saved=await send(['cast','music']);assert.equal(saved.status,200);assert.equal((await saved.json()).saved,true);
assert.equal((await send(['action'])).status,429);
const revisit=await(await fetch(endpoint,{headers:{Cookie:cookie}})).json();assert.deepEqual([...revisit.selection].sort(),['cast','music']);
await setTimeout(3100);
const changed=await send(['action','story']);assert.equal(changed.status,200);
const updated=await changed.json();assert.equal(updated.results.participants,revisit.participants);
assert.deepEqual([...updated.selection].sort(),['action','story']);
// Five separate signed identities make the local discovery threshold testable.
for(let i=0;i<4;i++){
  const newIdentity=await fetch(endpoint);const newCookie=newIdentity.headers.get('set-cookie').split(';')[0];
  const response=await send(['music'],{Cookie:newCookie});assert.equal(response.status,200);
}
const discovery=await(await fetch(harness+'/rest/v1/rpc/discover_oshi_plays',{method:'POST',body:JSON.stringify({p_point_id:'music'})})).json();
assert.ok(discovery.some(row=>row.play_slug===rows[0].slug && Number(row.participants)>=5));
const status=await(await fetch(harness+'/local-test-status')).json();assert.equal(status.liveWrites,0);
console.log(JSON.stringify({passed:true,apiChecks:17,participantsUnchangedOnEdit:true,discoveryMinimum5:true,localWrites:status.localWrites,liveWrites:status.liveWrites},null,2));
