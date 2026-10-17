import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'stage-streaming-'));
const modules=['streaming-links','streaming-analytics','streaming-guide'];
for (const name of modules) {
  const src = await readFile(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
  await writeFile(join(dir, name+'.js'), ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
}
after(async()=>{for(const name of modules)await unlink(join(dir,name+'.js'));await rmdir(dir);});
const require = createRequire(import.meta.url);
const { normalizeVod, getStreamingService } = require(join(dir,'streaming-links.js'));
const { describeStreamingClick, observeStreamingClick } = require(join(dir,'streaming-analytics.js'));
const { matchesStreamingService, streamingGuidePath } = require(join(dir,'streaming-guide.js'));
const affiliate = 'https://al.dmm.com/?lurl=https%3A%2F%2Ftv.dmm.com%2Fvod%2Fdetail%2F%3Fseason%3Dknown&af_id=stageconnect-001&ch=link_tool&ch_id=link';
const context = { origin:'https://stageconnect.jp',pathname:'/en/plays/example',placement:'play_streaming',playId:'2030b49a-e943-4042-b3f8-c83e478e4261' };

test('empty fields never indicate availability',()=>{
  for(const value of [null,{},[],{dmm:'',unext:' ',danime:'#'},'https://tv.dmm.com'])assert.equal(normalizeVod(value),null);
});
test('only provider destinations are actionable and affiliate parameters are preserved',()=>{
  assert.deepEqual(normalizeVod({dmm:affiliate,unext:'',danime:''}),{dmm:affiliate});
  assert.deepEqual(normalizeVod({DMMTV:affiliate}),{dmm:affiliate});
  for(const href of ['javascript:alert(1)','//tv.dmm.com','https://tv.dmm.com.evil.example','https://user:pass@tv.dmm.com','https://al.dmm.com/?lurl=https%3A%2F%2Fevil.example'])assert.equal(getStreamingService(href),null,href);
  assert.deepEqual(normalizeVod({dmm:'https://video.unext.jp/title/one'}),null);
  assert.deepEqual(normalizeVod({unext:'https://video.unext.jp/title/one',danime:'https://animestore.docomo.ne.jp/title/one'}),{unext:'https://video.unext.jp/title/one',danime:'https://animestore.docomo.ne.jp/title/one'});
});
test('outbound analytics identify service, placement, language and stable play id',()=>{
  const data = describeStreamingClick(affiliate,context);
  assert.equal(data.streaming_service,'dmm'); assert.equal(data.link_kind,'outbound');
  assert.equal(data.site_locale,'en'); assert.equal(data.play_id,context.playId); assert.equal(data.play_slug,'example');
  assert.ok(!JSON.stringify(data).includes('af_id')); assert.ok(!JSON.stringify(data).includes('season='));
});
test('guide navigation is separate from outbound visits and does not manufacture a sale',()=>{
  const data=describeStreamingClick('/watch/dmm?secret=no', {...context,pathname:'/',placement:'home_banner',playId:undefined});
  assert.equal(data.link_kind,'guide'); assert.equal(data.streaming_service,'dmm'); assert.equal(data.page_type,'home');
  assert.equal(data.play_id,undefined); assert.ok(!('value' in data)); assert.ok(!('transaction_id' in data));
  assert.equal(describeStreamingClick('/actors/example',context),null);
  assert.equal(describeStreamingClick(affiliate,{...context,pathname:'/admin/plays'}),null);
  assert.equal(describeStreamingClick('/en/watch/u-next',{...context,placement:'header'}).streaming_service,'unext');
  assert.equal(describeStreamingClick('/en/watch/unknown',context),null);
});

test('provider filters combine without admitting another provider or a missing link',()=>{
  const entries=[{slug:'one',vod:normalizeVod({dmm:affiliate})},{slug:'two',vod:normalizeVod({unext:'https://video.unext.jp/title/two'})},{slug:'three',vod:normalizeVod({dmm:'#'})}];
  assert.deepEqual(entries.filter(item=>matchesStreamingService(item.vod,'dmm')).map(item=>item.slug),['one']);
  assert.deepEqual(entries.filter(item=>matchesStreamingService(item.vod,'unext')).map(item=>item.slug),['two']);
  assert.equal(entries.filter(item=>matchesStreamingService(item.vod,'danime')).length,0);
  assert.equal(entries.filter(item=>matchesStreamingService(item.vod,'invalid')).length,3);
  assert.equal(streamingGuidePath('en','unext'),'/en/watch/u-next');
});
test('left, middle, keyboard-style clicks use one event, without preventing navigation',()=>{
  const priorElement=globalThis.Element, priorWindow=globalThis.window;
  class Element { closest(){return link;} }
  const scope={dataset:{streamingPlacement:'series_timeline'}};
  const play={dataset:{playId:context.playId,playSlug:'example'}};
  const link={href:affiliate,closest:selector=>selector==='[data-streaming-placement]'?scope:play};
  const events=[];
  try{
    globalThis.Element=Element; globalThis.window={location:{origin:context.origin,pathname:'/series/example'}};
    for(const button of [0,1,2])observeStreamingClick({button,target:new Element(),defaultPrevented:false},(...args)=>events.push(args));
    observeStreamingClick({button:0,target:new Element(),defaultPrevented:true},(...args)=>events.push(args));
    assert.equal(events.length,2); assert.ok(events.every(([name])=>name==='streaming_click'));
    assert.equal(events[0][1].play_id,context.playId); assert.equal(events[0][1].placement,'series_timeline');
  }finally{globalThis.Element=priorElement;globalThis.window=priorWindow;}
});
test('GA bootstrap queues config before events and stays inactive on previews/local/admin',async()=>{
  const source=await readFile(new URL('../components/SiteDocument.tsx',import.meta.url),'utf8');
  const template=source.match(/<Script id="ga4-init"[^>]*>\{(`([\s\S]*?)`)\}<\/Script>/)?.[1];
  assert.ok(template); assert.ok(source.includes('strategy="beforeInteractive"'));
  const code=vm.runInNewContext(template,{gaId:'G-TEST123'});
  for(const [hostname,pathname,enabled] of [['stageconnect.jp','/plays/test',true],['localhost','/',false],['preview.vercel.app','/',false],['stageconnect.jp','/admin',false]]){
    const tags=[]; const window={location:{hostname,pathname,origin:'https://'+hostname}};
    const context=vm.createContext({window,document:{createElement:()=>({}),head:{appendChild:tag=>tags.push(tag)}}});
    // The browser's global object is also window; dataLayer is a browser global.
    Object.defineProperty(context,'dataLayer',{get:()=>window.dataLayer});
    vm.runInContext(code,context);
    assert.equal(tags.length,enabled?1:0,hostname+pathname);
    if(enabled){assert.equal(window.dataLayer[1][0],'config');assert.equal(window.dataLayer[1][2].send_page_view,false);assert.equal(tags[0].src,'https://www.googletagmanager.com/gtag/js?id=G-TEST123');}
  }
});

test('delegated tracking observes links before Next.js prevents navigation and cleans up listeners',async()=>{
  const source=await readFile(new URL('../components/StreamingClickTracker.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const listeners=new Map(), recorded=[];
  let cleanup;
  const context={exports:{},require:name=>name==='react'?{useEffect:effect=>{cleanup=effect();}}:{observeStreamingClick:event=>recorded.push(event.button)},document:{
    addEventListener:(type,handler,capture)=>{assert.equal(capture,true);listeners.set(type,handler);},
    removeEventListener:(type,handler,capture)=>{assert.equal(capture,true);assert.equal(listeners.get(type),handler);listeners.delete(type);},
  }};
  vm.runInNewContext(code,context); context.exports.StreamingClickTracker();
  listeners.get('click')({button:0,defaultPrevented:false});
  listeners.get('click')({button:1}); listeners.get('auxclick')({button:1}); listeners.get('auxclick')({button:2});
  assert.deepEqual(recorded,[0,1]); cleanup(); assert.equal(listeners.size,0);
});
