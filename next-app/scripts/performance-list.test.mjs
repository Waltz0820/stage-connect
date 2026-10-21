import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {createRequire} from 'node:module';import ts from 'typescript';
const directory=await mkdtemp(join(tmpdir(),'stage-performance-list-'));
after(()=>rm(directory,{recursive:true,force:true}));
const source=await readFile(new URL('../lib/performance-list.ts',import.meta.url),'utf8');
await writeFile(join(directory,'list.cjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {splitPerformanceList,extractPerformanceCities}=createRequire(import.meta.url)(join(directory,'list.cjs'));

test('DIVE Tokyo and Osaka are two venues and two cities',()=>{
 assert.deepEqual(splitPerformanceList('東京：シアター1010／大阪：森ノ宮ピロティホール'),['東京：シアター1010','大阪：森ノ宮ピロティホール']);
 assert.deepEqual(extractPerformanceCities('東京：2018年9月20日〜30日／大阪：2018年10月6日〜7日'),['東京','大阪']);
});
test('half-width list separators, full-width separators and line breaks can be mixed',()=>{
 assert.deepEqual(splitPerformanceList(' 東京：A / 大阪：B／福岡：C\r\n愛知：D\n\n'),['東京：A','大阪：B','福岡：C','愛知：D']);
 assert.deepEqual(splitPerformanceList('東京：A／／大阪：B'),['東京：A','大阪：B']);
});
test('ASCII and full-width date slashes and venue names stay intact',()=>{
 for(const value of ['2018/9/20-30','2018／9／20-30','２０１８／９／２０〜３０','東京：THEATER A/B'])assert.deepEqual(splitPerformanceList(value),[value]);
 assert.deepEqual(splitPerformanceList('東京：2018/9/20-30 / 大阪：2018/10/6-7'),['東京：2018/9/20-30','大阪：2018/10/6-7']);
});
test('city names support both colons and direct dates and keep the first appearance order',()=>{
 assert.deepEqual(extractPerformanceCities('東京・シアター1010：2011年7月1日〜3日／名古屋公演:7月9日〜10日／東京・シアタークリエ：8月4日〜30日'),['東京','名古屋']);
 assert.deepEqual(extractPerformanceCities('大阪 2018/10/6-7 / 東京 2018年9月20日〜30日'),['大阪','東京']);
 assert.deepEqual(extractPerformanceCities('東京：2018/9/20 / 東京：2018/9/21'),['東京']);
});
test('missing values and unlabelled dates do not invent a city or venue',()=>{
 for(const value of [null,undefined,'','  \n ']){assert.deepEqual(splitPerformanceList(value),[]);assert.deepEqual(extractPerformanceCities(value),[]);}
 assert.deepEqual(extractPerformanceCities('2018/9/20〜30'),[]);
 assert.deepEqual(extractPerformanceCities('2018年9月20日19:00／2018年9月21日14:00'),[]);
 assert.deepEqual(splitPerformanceList('シアター1010'),['シアター1010']);
});

test('Bakuman district qualifiers count as two cities while all three venue runs remain intact',()=>{
 const period='東京（天王洲）：2021年10月8日〜17日／東京（水道橋）：2021年10月21日〜24日／大阪：2021年10月28日〜31日';
 assert.deepEqual(extractPerformanceCities(period),['東京','大阪']);
 assert.deepEqual(splitPerformanceList(period),['東京（天王洲）：2021年10月8日〜17日','東京（水道橋）：2021年10月21日〜24日','大阪：2021年10月28日〜31日']);
 assert.deepEqual(splitPerformanceList('東京：天王洲 銀河劇場／東京：TOKYO DOME CITY HALL／大阪：メルパルクホール大阪'),['東京：天王洲 銀河劇場','東京：TOKYO DOME CITY HALL','大阪：メルパルクホール大阪']);
});

test('parenthesized venue qualifiers normalize in both scripts and repeated tour stops',()=>{
 assert.deepEqual(extractPerformanceCities('Tokyo (Tennozu): 2021/10/8-17 / Tokyo (Suidobashi): 2021/10/21-24 / Osaka: 2021/10/28-31'),['Tokyo','Osaka']);
 assert.deepEqual(extractPerformanceCities('東京公演（銀河劇場）：10月8日／東京（東京ドームシティホール）公演：10月21日／大阪（メルパルク）会場：10月28日'),['東京','大阪']);
});
