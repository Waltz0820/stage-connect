import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

const base=process.env.STAGE_VERIFY_BASE_URL || 'http://127.0.0.1:8139';
const pairs=['/','/actors','/plays','/series','/actors/sato-ryuji','/plays/tennimu-1st-final-rikkai-second','/plays/touken-ranbu-stage-tandokugyo','/series/tennimu','/series/butai-touken-ranbu'];
const paths=pairs.flatMap(path=>[path,path==='/'?'/en':'/en'+path]);
paths.push('/search?q=佐藤','/en/search?q=sato','/plays?q=刀剣&format=musical','/actors?q=佐藤流司','/series?q=テニス','/watch/dmm','/tags','/privacy','/tags/tag_style_sharp','/watch','/watch/u-next','/guide');
paths.push('/favorites','/guide/touken-ranbu-complete-guide','/watch/danime','/contact');
paths.push('/about','/en/about');
paths.push('/search','/en/search','/search?q=サトウリュウジ','/en/search?q=Final%20Match%20Rikkai','/actors?q=a&gender=male&page=2','/en/actors?q=a&gender=male&page=2','/series?q=舞台&format=stage&sort=name_asc&page=2','/en/series?q=stage&format=stage&sort=name_asc&page=2');
paths.push('/series/touken-ranbu-musical','/en/series/touken-ranbu-musical','/series/tennimu-2nd','/en/series/tennimu-2nd','/plays/ace-stage-aw','/en/plays/ace-stage-aw','/plays?streaming=available','/en/plays?streaming=available');
paths.push('/en/watch','/en/watch/dmm','/en/watch/u-next','/en/watch/danime');
for(const prefix of ['', '/en']) paths.push(`${prefix}/plays?service=dmm&streaming=available&q=刀剣&format=stage&page=2`,`${prefix}/plays?service=unext`,`${prefix}/plays?service=danime`);
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
  if(path === '/about' || path === '/en/about') {
    assert.equal($('.about-node').length,5,path+' real relationship nodes');
    assert.equal($('.about-connection > a').length,5,path+' navigable archive connections');
    assert.equal($('link[rel="alternate"][hreflang="en"]').attr('href'),'https://stageconnect.jp/en/about',path+' English counterpart');
    for(const node of $('.about-node').toArray()) assert.equal($($(node).attr('href')).length,1,path+' node explanation target');
  }
  if(/^\/(en\/)?watch(?:\/|$)/.test(path)) {
    const dmmLanding=path.endsWith('/watch/dmm');
    if(dmmLanding) {
      assert.equal($('.dmm-lp__cta').length,3,path+' hero, plan and closing signup links');
      assert.ok($(`main a[href="${en?'/en':''}/plays?streaming=available&service=dmm"]`).length,path+' existing DMM discovery route');
      assert.equal($('.dmm-lp__viewing').length,3,path+' three viewing perspectives');
    } else assert.equal($('main form input[name="q"]').length,1,path+' search for a production');
    assert.ok($('main time[datetime]').length,path+' reviewed date');
    assert.equal($('link[rel="canonical"]').attr('href'),'https://stageconnect.jp'+path,path+' canonical');
    assert.equal($('link[rel="alternate"][hreflang="en"]').attr('href'),'https://stageconnect.jp'+(en?path:'/en'+path),path+' English alternate');
    const faq=JSON.parse($('script[type="application/ld+json"]').toArray().map(node=>$(node).text()).find(text=>text.includes('FAQPage')));
    for(const question of faq.mainEntity) assert.ok($(dmmLanding?'.dmm-lp__support':'.faq-card').text().includes(question.acceptedAnswer.text),path+' visible FAQ equals structured FAQ');
    assert.ok(!/国内最多クラス|かなり限定的|一部のみ/.test($('main').text()),path+' no unverified catalogue comparison');
    if(path.endsWith('/danime')) assert.ok($('.streaming-service-card__price').text().includes('660'),path+' current Web price');
    if(path.endsWith('/u-next')||path.endsWith('/danime')) {
      assert.equal($('.streaming-guide__signup').length,0,path+' no unrelated DMM signup');
      assert.ok($('#productions a[target="_blank"]').length,path+' official catalogue access');
    }
  }
  if(/^\/(en\/)?plays\?.*service=/.test(path)) {
    const current=new URL(path,base);
    assert.equal($('select[name="service"] option[selected]').attr('value'),current.searchParams.get('service'),path+' selected provider');
    for(const node of $('.filter-chip,.pagination-link').toArray()) {
      const target=new URL($(node).attr('href'),base);
      for(const key of ['service','streaming','q','format']) assert.equal(target.searchParams.get(key),current.searchParams.get(key),path+' preserve '+key);
    }
  }
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
