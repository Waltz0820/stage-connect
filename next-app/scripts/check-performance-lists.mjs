import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as cheerio from 'cheerio';

const base=process.env.STAGE_VERIFY_BASE_URL || 'http://127.0.0.1:8149';
const baseline=process.env.STAGE_VERIFY_BASELINE ? JSON.parse(await readFile(process.env.STAGE_VERIFY_BASELINE,'utf8')) : null;
const expectFixed=process.env.STAGE_EXPECT_FIXED !== 'false';
const cases=[['dive2018',2],['bleach2011',6],['enstars-extra-stage-memory-of-marionette',6],['nanbaka2017',1],['tennimu-1st-final-rikkai-second',null],['touken-ranbu-stage-tandokugyo',null],['kingdom-stage',4]];
const rows=[];
for(const [slug,count]of cases)for(const prefix of['','/en']){
 const path=prefix+'/plays/'+slug,r=await fetch(base+path,{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path);const $=cheerio.load(await r.text());
 assert.equal($('h1').length,1,path);assert.equal($('html').attr('lang'),prefix?'en':'ja');assert.equal($('link[rel="canonical"]').attr('href'),'https://stageconnect.jp'+path);
 assert.equal($('.oshi-choice').length,10,path);assert.ok($('#streaming').length,path);
 const cards=$('#cast .cast-group-block').toArray().map(g=>({heading:$(g).find('.group-chip').text(),cards:$(g).find('.cast-card-link').toArray().map(c=>({href:$(c).attr('href'),text:$(c).text().replace(/\s+/g,' ').trim()}))}));
 const creative=$('script[type="application/ld+json"]').toArray().map(n=>JSON.parse($(n).text())).find(o=>o['@type']==='CreativeWork');assert.ok(creative);
 const performance=$('#performances').text().replace(/\s+/g,' ').trim(),row={path,cards,creative,performance};assert.ok(cards.length,path+' cast preserved');
 if(expectFixed&&!prefix&&count!==null)assert.ok($('#performances .subtle-line').toArray().some(n=>$(n).text()===count+'会場'),path+' venue count');
 if(expectFixed&&slug==='dive2018'){
  assert.ok(performance.includes(prefix?'2 cities':'2都市'),path+' two cities');
  if(!prefix)for(const value of['2018年9月20日〜30日','2018年10月6日〜7日','シアター1010','森ノ宮ピロティホール'])assert.ok(performance.includes(value),path+' '+value);
 }
 if(baseline){const old=baseline.rows.find(row=>row.path===path);assert.ok(old);assert.deepEqual(cards,old.cards,path+' cast unchanged');assert.deepEqual(creative,old.creative,path+' structured data unchanged');}
 rows.push(row);
}
const out={passed:true,pages:rows.length,base,expectFixed,comparedBaseline:!!baseline,rows};
if(process.env.STAGE_VERIFY_OUTPUT)await writeFile(process.env.STAGE_VERIFY_OUTPUT,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,pages:rows.length,base,expectFixed,comparedBaseline:!!baseline}));
