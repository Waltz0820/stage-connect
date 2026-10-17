import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

const base=process.env.STAGE_VERIFY_BASE_URL || 'http://127.0.0.1:8139';
const pairs=['/','/actors','/plays','/series','/actors/sato-ryuji','/plays/tennimu-1st-final-rikkai-second','/plays/touken-ranbu-stage-tandokugyo','/series/tennimu','/series/butai-touken-ranbu'];
const paths=pairs.flatMap(path=>[path,path==='/'?'/en':'/en'+path]);
paths.push('/search?q=佐藤','/en/search?q=sato','/plays?q=刀剣&format=musical','/actors?q=佐藤流司','/series?q=テニス','/watch/dmm','/tags','/privacy','/tags/tag_style_sharp','/watch','/watch/u-next','/guide');
paths.push('/favorites','/guide/touken-ranbu-complete-guide','/watch/danime','/contact');
paths.push('/search','/en/search','/search?q=サトウリュウジ','/en/search?q=Final%20Match%20Rikkai','/actors?q=a&gender=male&page=2','/en/actors?q=a&gender=male&page=2','/series?q=舞台&format=stage&sort=name_asc&page=2','/en/series?q=stage&format=stage&sort=name_asc&page=2');
paths.push('/series/touken-ranbu-musical','/en/series/touken-ranbu-musical','/series/tennimu-2nd','/en/series/tennimu-2nd','/plays/ace-stage-aw','/en/plays/ace-stage-aw','/plays?streaming=available','/en/plays?streaming=available');
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
  if(/^\/(en\/)?series\/(tennimu|butai-touken-ranbu|touken-ranbu-musical)$/.test(path)) assert.ok($('.timeline-excerpt').length>0,path+' existing synopsis excerpt');
  if(path.endsWith('/series/tennimu-2nd')) assert.equal($('.timeline-excerpt').length,0,path+' no empty excerpt boxes');
  if(path.includes('/plays/ace-stage-aw')) {
    assert.equal($('#streaming a[target="_blank"]').length,0,path+' placeholders are not destinations');
    assert.ok($('.detail-ledger').text().includes(en?'Not confirmed':'未確認'),path+' missing links are unconfirmed');
  }
  for(const node of $('a[href*="al.dmm.com"]').toArray()) {
    assert.ok($(node).closest('[data-streaming-placement]').length,path+' streaming click context');
    assert.ok(!['#',''].includes($(node).attr('href')),path+' no placeholder link');
  }
  if(/^\/(en\/)?(actors|plays|series)\//.test(path)) {
    const section=path.replace(/^\/en/,'').split('/')[1];
    assert.equal($(`.breadcrumbs a[href="${en?'/en':''}/${section}"]`).length,1,path+' return to list');
    assert.ok($('.breadcrumbs__current').text().trim().length>0,path+' current breadcrumb');
  }
  if(/^\/(en\/)?(actors|series)\?/.test(path)) {
    const current=new URL(path,base);
    for(const node of $('.filter-chip,.pagination-link').toArray()) {
      const target=new URL($(node).attr('href'),base);
      assert.equal(target.searchParams.get('q'),current.searchParams.get('q'),path+' filter preserves query');
    }
  }
  if(/^\/(en\/)?search/.test(path)) assert.equal($('main form input[name="q"]').length,1,path+' editable search');
  if(path.includes('サトウリュウジ')) assert.ok($('main a[href="/actors/sato-ryuji"]').length,path+' kana actor search');
  if(path.includes('Final%20Match')) assert.ok($('main a[href="/en/plays/tennimu-1st-final-rikkai-second"]').length,path+' English title search');
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
