import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

const base=process.env.STAGE_VERIFY_BASE_URL || 'http://127.0.0.1:8139';
const pairs=['/','/actors','/plays','/series','/actors/sato-ryuji','/plays/tennimu-1st-final-rikkai-second','/plays/touken-ranbu-stage-tandokugyo','/series/tennimu','/series/butai-touken-ranbu'];
const paths=pairs.flatMap(path=>[path,path==='/'?'/en':'/en'+path]);
paths.push('/search?q=佐藤','/en/search?q=sato','/plays?q=刀剣&format=musical','/actors?q=佐藤流司','/series?q=テニス','/watch/dmm','/tags','/privacy','/tags/tag_style_sharp','/watch','/watch/u-next','/guide');
paths.push('/favorites','/guide/touken-ranbu-complete-guide','/watch/danime','/contact');
const report=[];
for(const path of paths){
  const response=await fetch(base+path);assert.equal(response.status,200,path);
  const $=cheerio.load(await response.text());
  const en=path.startsWith('/en');
  assert.equal($('html').attr('lang'),en?'en':'ja',path);
  assert.equal($('main').length,1,path+' must have one main');
  assert.equal($('h1').length,1,path+' must have one h1');
  assert.equal($('meta[name="viewport"]').length,1,path);
  assert.equal($('a[href^="/tags"]').length,0,path+' old tag navigation');
  assert.equal($('.play-detail-tags-section').length,0,path);
  assert.equal($('.play-poster-frame').length,0,path+' synthetic poster removed');
  if(/^\/(en\/)?plays\//.test(path)){
    assert.equal($('.oshi-choice').length,10,path);
    assert.ok($('#cast a[href*="/actors/"]').length>0,path+' cast links');
    assert.ok($('#performances').length && $('#streaming').length,path+' information sections');
    for(const [,node] of $('.detail-contents-nav a[href^="#"]').toArray().entries())assert.equal($($(node).attr('href')).length,1,path+' anchor target');
    assert.ok($('link[rel="canonical"]').attr('href')?.endsWith(path),path+' canonical');
  }
  if(path==='/actors?q=佐藤流司')assert.ok($('.catalog-card--actor-list').text().includes('佐藤 流司'));
  if(path.startsWith('/plays?q=')){
    for(const node of $('.pagination-link').toArray())assert.ok($(node).attr('href').includes('q=') && $(node).attr('href').includes('format=musical'));
  }
  report.push({path,status:response.status,lang:$('html').attr('lang'),castLinks:$('#cast a').length});
}
console.log(JSON.stringify({passed:true,pages:report.length,report},null,2));
