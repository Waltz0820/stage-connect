import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {createRequire} from 'node:module';import ts from 'typescript';
const directory=await mkdtemp(join(tmpdir(),'stage-period-'));
after(()=>rm(directory,{recursive:true,force:true}));
const source=await readFile(new URL('../lib/performance-period.ts',import.meta.url),'utf8');
await writeFile(join(directory,'period.cjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {getPerformanceStart,performanceStartSortKey,compactPerformancePeriod}=createRequire(import.meta.url)(join(directory,'period.cjs'));
test('theatre numbers never replace the actual performance date',()=>{
 const period='東京・シアター1010：2011年7月1日〜3日／名古屋：7月9日〜10日／東京・シアタークリエ：8月4日〜30日';
 assert.deepEqual(getPerformanceStart(period),{year:2011,month:7,day:1});
 assert.equal(performanceStartSortKey(period),20110701);
 for(const locale of ['ja','en'])assert.equal(compactPerformancePeriod(period,locale),'2011/07');
 assert.equal(getPerformanceStart('シアター1010'),null);
});
test('Japanese, ISO, slash and full-width dates share calendar values',()=>{
 for(const period of ['2011年7月1日〜3日','2011-07-01 to 2011-08-30','2011/7/1 - 8/30','東京：２０１１年７月１日〜３日'])assert.deepEqual(getPerformanceStart(period),{year:2011,month:7,day:1});
 assert.deepEqual(getPerformanceStart('2007年3月'),{year:2007,month:3,day:null});
 assert.deepEqual(getPerformanceStart('2005年'),{year:2005,month:null,day:null});
 assert.equal(compactPerformancePeriod('2005年'),'2005');
});
test('invalid calendar values, venue-only and missing periods do not become dates',()=>{
 for(const period of ['2006年13月1日','2011/2/29','2025-04-31','2006/0/10','2006/1/32','THEATRE1010',null,''])assert.equal(getPerformanceStart(period),null,period);
 assert.equal(performanceStartSortKey(null),-1);
 assert.equal(compactPerformancePeriod(null),'公演時期未定');
 assert.equal(compactPerformancePeriod(null,'en'),'TBA');
 assert.equal(performanceStartSortKey('2024/02/29'),20240229);
});
test('series order follows dated performances, including two different shows in one year',()=>{
 const plays=[['2005','2005年8月17日〜28日'],['2006','大阪：2006年1月5日〜8日／東京：2006年1月14日〜19日'],['2006-2','大阪：2006年8月10日〜13日／東京：2006年8月16日〜21日'],['2007','2007年1月10日〜14日'],['2007-2','東京：2007年3月21日〜27日／兵庫：2007年4月3日〜8日'],['2008','2008年3月24日〜26日・30日'],['2008-2','2008年3月27日〜29日・31日'],['2010','福岡：2010年1月15日〜17日／東京：2010年1月29日〜2月8日'],['2011','東京・シアター1010：2011年7月1日〜3日／東京・シアタークリエ：8月4日〜30日'],['2012','2012年8月30日〜9月9日'],['2016','東京：2016年7月28日〜8月7日'],['2024','東京：2024年5月12日〜26日'],['2025','東京：2025年2月8日〜24日']];
 assert.deepEqual([...plays].sort((a,b)=>performanceStartSortKey(b[1])-performanceStartSortKey(a[1])).map(p=>p[0]),['2025','2024','2016','2012','2011','2010','2008-2','2008','2007-2','2007','2006-2','2006','2005']);
});
