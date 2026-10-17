import Link from 'next/link';
import { Breadcrumbs } from './Breadcrumbs';
import { ArchiveIcon } from './ArchiveIcon';
import { StructuredData } from './StructuredData';
import { buildBreadcrumbList } from '../lib/structured-data';
import { getPlayList, periodSortKey } from '../lib/stage-connect';
import { getEnglishPlayTitle } from '../lib/en-copy';
import { STREAMING_GUIDES, STREAMING_REVIEWED_ON, matchesStreamingService, streamingGuidePath } from '../lib/streaming-guide';
import type { StreamingService } from '../lib/streaming-links';
import type { SiteLocale } from '../lib/locale-routing';

export default async function StreamingGuide({ locale, service }: { locale: SiteLocale; service?: StreamingService }) {
  const en = locale === 'en', prefix = en ? '/en' : '';
  const allPlays = await getPlayList();
  const linked = allPlays.filter(play => play.vod && Object.keys(play.vod).length && matchesStreamingService(play.vod, service ?? ''));
  const plays = [...linked].sort((a,b) => periodSortKey(b.period)-periodSortKey(a.period) || a.slug.localeCompare(b.slug)).slice(0,6);
  const item = STREAMING_GUIDES.find(item => item.id === service);
  const shownServices = item ? [item] : STREAMING_GUIDES;
  const serviceName = (entry: typeof STREAMING_GUIDES[number]) => en && entry.id === 'danime' ? 'd Anime Store' : entry.name;
  const title = item ? (en ? `Stage productions on ${serviceName(item)}` : `${serviceName(item)}で舞台を探す`) : (en ? 'Find a stream for your next stage production' : '見たい舞台から、配信を探す。');
  const listing = `${prefix}/plays?streaming=available${service ? '&service='+service : ''}`;
  const breadcrumbs = [{name:en?'Home':'ホーム',path:prefix || '/'},{name:en?'Streaming guide':'配信ガイド',path:prefix+'/watch'},...(item?[{name:serviceName(item),path:streamingGuidePath(locale,service)}]:[])];
  const faqs = en ? [
    {q:'Does a listed link mean the recording is included in a subscription?',a:'A link identifies a provider’s page. It does not confirm current availability or inclusion in a subscription. Check the exact production, performance date, price and availability period on the provider’s page.'},
    {q:'Why are there no production links for some services?',a:'Stage Connect is still collecting individual production links. Missing links do not mean a service has no stage productions. You can search the official catalogue directly.'},
    {q:'Are these services available outside Japan?',a:'Prices and trial information here apply to Japanese services. Availability, playback regions and language options depend on the provider and title; check the official page before subscribing.'},
  ] : [
    {q:'リンクがある作品は、すべて見放題ですか？',a:'配信リンクはサービスの作品ページへの入口です。現在の配信や見放題を保証するものではありません。作品・公演回・料金・配信期間をリンク先で確認してください。'},
    {q:'作品リンクがないサービスは、舞台を配信していないのですか？',a:'Stage Connectでの作品リンク収集がまだ進んでいない場合があります。リンクの未登録は配信なしを意味しません。公式サイトの作品一覧や検索も利用できます。'},
    {q:'無料体験なら、追加料金はかかりませんか？',a:'無料体験は対象プランの月額利用料に対する特典です。レンタル・購入などの個別課金作品は別料金になる場合があります。登録方法ごとの適用条件も確認してください。'},
  ];
  return <main className="container streaming-guide" data-streaming-placement="watch_content">
    <StructuredData data={buildBreadcrumbList(breadcrumbs)}/>
    <StructuredData data={{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(faq=>({'@type':'Question',name:faq.q,acceptedAnswer:{'@type':'Answer',text:faq.a}}))}}/>
    <Breadcrumbs items={breadcrumbs.slice(1).map(crumb=>({label:crumb.name,href:crumb.path}))}/>
    <section className="streaming-guide__hero" data-streaming-placement="watch_hero">
      <span className="eyebrow">STREAMING GUIDE</span>
      <h1>{title}</h1>
      <p>{item ? item[locale].intro : en ? 'Search for a recording, compare viewing options, then follow the production’s streaming link.' : '作品を探して、視聴条件を確かめる。キャストやシリーズから気になった舞台を、次の一本へ。'}</p>
      <form className="streaming-guide__search" action={prefix+'/plays'}>
        <input type="hidden" name="streaming" value="available"/>
        <label className="sr-only" htmlFor="streaming-query">{en?'Production or series name':'作品名・シリーズ名'}</label>
        <input id="streaming-query" name="q" placeholder={en?'Search productions or series':'作品名・シリーズ名で探す'} maxLength={200}/>
        <label className="sr-only" htmlFor="streaming-service">{en?'Streaming service':'配信サービス'}</label>
        <select id="streaming-service" name="service" defaultValue={service ?? ''}><option value="">{en?'All services':'すべてのサービス'}</option>{STREAMING_GUIDES.map(entry=><option key={entry.id} value={entry.id}>{serviceName(entry)}</option>)}</select>
        <button type="submit" aria-label={en?'Search productions with streaming links':'配信リンクのある作品を検索'}>→</button>
      </form>
    </section>
    <nav className="streaming-guide__tabs" aria-label={en?'Streaming services':'配信サービス'}>
      <Link href={prefix+'/watch'} aria-current={!service?'page':undefined}>{en?'Compare services':'サービス比較'}</Link>
      {STREAMING_GUIDES.map(entry=><Link key={entry.id} href={streamingGuidePath(locale,entry.id)} aria-current={service===entry.id?'page':undefined}>{serviceName(entry)}</Link>)}
    </nav>
    <section className="section-card stack-md">
      <div className="section-header-inline"><h2 className="section-title">{en?'Plans and trial conditions':'料金と初回無料の条件'}</h2><span className="catalog-note">{en?'Reviewed':'確認日'} <time dateTime={STREAMING_REVIEWED_ON}>{STREAMING_REVIEWED_ON}</time></span></div>
      <p className="catalog-note">{en?'Japanese Web subscription prices, including tax. App subscriptions may differ.' : '日本国内のWeb登録時の税込料金です。アプリ経由は料金・無料期間が異なります。'}</p>
      <div className={`streaming-guide__services${item?' is-single':''}`}>
        {shownServices.map(entry=><article className="streaming-service-card" key={entry.id}>
          <div className="streaming-service-card__heading"><ArchiveIcon name="play"/><h3>{serviceName(entry)}</h3></div>
          <p className="streaming-service-card__price">{en?'¥':''}{entry.monthlyYen.toLocaleString(en?'en-US':'ja-JP')}<small>{en?' / month':'円 / 月'}</small></p>
          <span className="streaming-service-card__trial">{en?'Trial · ':'無料体験 · '}{entry[locale].trial}</span>
          <p>{entry[locale].conditions}</p><p className="catalog-note">{entry[locale].note}</p>
          <div className="streaming-service-card__actions">
            {!item?<Link className="action-button" href={streamingGuidePath(locale,entry.id)}>{en?'View guide':'詳しく見る'} <span aria-hidden="true">→</span></Link>:null}
            <a className="catalog-link" data-streaming-placement="watch_plan" href={entry.officialUrl} target="_blank" rel="noopener noreferrer">{en?'Official plan details':'公式の料金・条件を確認'} ↗</a>
          </div>
        </article>)}
      </div>
    </section>
    <section className="section-card stack-md" id="productions">
      <div className="section-header-inline"><h2 className="section-title">{en?'Productions with streaming links':'配信リンクのある作品'}</h2>{linked.length?<Link className="section-link" href={listing}>{en?`View all ${linked.length}`:`${linked.length}作品をすべて見る`} →</Link>:null}</div>
      <p className="catalog-note">{en?'Counts reflect links recorded in Stage Connect, not the provider’s total catalogue or currently included titles.' : '件数はStage Connectに登録された作品リンク数です。サービス全体の配信数や、現在の見放題作品数ではありません。'}</p>
      {plays.length?<div className="streaming-guide__productions">{plays.map(play=><Link className="streaming-production" key={play.slug} href={prefix+'/plays/'+play.slug}>
        <span className="streaming-production__icon"><ArchiveIcon name="theatre"/></span><span><strong>{en?getEnglishPlayTitle(play):play.title}</strong><small>{play.period || (en?'Date not recorded':'公演時期未登録')}</small></span><span aria-hidden="true">→</span>
      </Link>)}</div>:<div className="streaming-guide__empty"><ArchiveIcon name="play"/><p>{en?'We are still collecting individual production links for this service. Search its official catalogue for your title.' : 'このサービスの作品リンクは現在収集中です。見たい作品は公式サイトの一覧・検索から確認できます。'}</p></div>}
      {item?<a className="action-button" data-streaming-placement="watch_catalogue" href={item.catalogueUrl} target="_blank" rel="noopener noreferrer">{en?`Search ${serviceName(item)}’s official catalogue`:`${serviceName(item)}の公式作品一覧へ`} ↗</a>:<Link className="action-button" href={listing}>{en?'Browse all linked productions':'配信リンクのある作品を探す'} →</Link>}
    </section>
    {item?.signupUrl?<section className="streaming-guide__signup" data-streaming-placement="watch_signup"><div><h2>{en?'Check DMM Premium membership':'DMMプレミアムの利用条件を確認'}</h2><p>{en?'First check the exact recording and whether it is included. The link below opens the membership page.' : '見たい公演と見放題対象を確かめたら、登録方法と初回無料の条件を確認できます。'}</p></div><a className="action-button action-button-primary" href={item.signupUrl} target="_blank" rel="sponsored noopener noreferrer">{en?'View membership details':'会員登録・初回無料の条件を見る'} ↗</a><small>{en?'Advertising: this is an affiliate link.' : '広告：このリンクにはアフィリエイトを利用しています。'}</small></section>:null}
    <section className="section-card stack-md"><h2 className="section-title">{en?'Before you watch':'視聴前に知っておきたいこと'}</h2><div className="faq-grid">{faqs.map(faq=><article className="faq-card" key={faq.q}><h3 className="faq-question">{faq.q}</h3><p className="faq-answer">{faq.a}</p></article>)}</div></section>
    <section className="streaming-guide__sources" data-streaming-placement="watch_sources"><h2>{en?'Official sources':'参照した公式情報'}</h2><p>{en?'Plan details reviewed on '+STREAMING_REVIEWED_ON+'. Check current conditions before subscribing.' : `${STREAMING_REVIEWED_ON}時点の公式情報を確認しています。お申し込み時は最新の条件をご確認ください。`}</p><ul>{shownServices.flatMap(entry=>entry.sources.map((url,index)=>{
      const labels = entry.id==='unext' ? (en?['Pricing','Free trial','Apple Account billing']:['料金','無料トライアル','Apple Account課金']) : (en?['Pricing and trial','Price change notice']:['料金・無料体験','料金改定のお知らせ']);
      return <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{serviceName(entry)} · {labels[index]} ↗</a></li>;
    }))}</ul></section>
  </main>;
}
