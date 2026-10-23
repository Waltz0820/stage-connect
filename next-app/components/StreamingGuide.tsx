import Link from 'next/link';
import { Breadcrumbs } from './Breadcrumbs';
import { ArchiveIcon } from './ArchiveIcon';
import { DirectorySearchForm } from './DirectorySearchForm';
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
  const plans = <section className="watch-section watch-plans" id="plans">
    <div className="watch-section-heading"><h2>{item ? (en ? 'Plans & trial' : '料金・無料体験') : (en ? 'Choose a service' : 'サービスから探す')}</h2><span className="watch-reviewed">{en ? 'Reviewed ' : '確認日 '}<time dateTime={STREAMING_REVIEWED_ON}>{STREAMING_REVIEWED_ON}</time></span></div>
    <p className="watch-note">{en ? 'Japanese Web prices, including tax. App prices and trial periods may differ.' : 'Web登録時の税込料金。アプリ経由は料金・無料期間が異なります。'}</p>
    <div className={`streaming-guide__services${item ? ' is-single' : ''}`}>
      {shownServices.map(entry => <article className={`streaming-service-card watch-plan--${entry.id}`} key={entry.id}>
        <div className="watch-plan-summary"><h3>{serviceName(entry)}</h3><p className="streaming-service-card__price">{en ? '¥' : ''}{entry.monthlyYen.toLocaleString(en ? 'en-US' : 'ja-JP')}<small>{en ? ' / month' : '円 / 月'}</small></p><span className="streaming-service-card__trial">{en ? 'Free trial · ' : '無料体験 · '}{entry[locale].trial}</span>
          {!item ? <Link className="watch-button" href={streamingGuidePath(locale, entry.id)}>{en ? 'Explore this service' : 'このサービスで探す'}<span aria-hidden="true">→</span></Link> : null}
        </div>
        {item ? <div className="watch-plan-conditions"><p>{entry[locale].conditions}</p><p>{entry[locale].note}</p><a className="watch-text-link" data-streaming-placement="watch_plan" href={entry.officialUrl} target="_blank" rel="noopener noreferrer">{en ? 'Official plan details' : '公式の料金・条件を確認'} <span aria-hidden="true">↗</span></a></div>
          : <details className="watch-plan-conditions"><summary>{en ? 'Pricing & trial conditions' : '料金・無料体験の条件'}<span aria-hidden="true">＋</span></summary><div><p>{entry[locale].conditions}</p><p>{entry[locale].note}</p><a className="watch-text-link" data-streaming-placement="watch_plan" href={entry.officialUrl} target="_blank" rel="noopener noreferrer">{en ? 'Official details' : '公式の料金・条件を確認'} <span aria-hidden="true">↗</span></a></div></details>}
      </article>)}
    </div>
  </section>;
  const productions = <section className="watch-section watch-productions" id="productions">
    <div className="watch-section-heading"><h2>{en ? 'Explore productions' : '作品から探す'}</h2>{linked.length ? <span className="watch-reviewed">{en ? `${linked.length} productions` : `${linked.length}作品`}</span> : null}</div>
    {plays.length ? <><p className="watch-note">{en ? 'Recorded streaming links. Check current availability and viewing options on the provider’s page.' : '配信リンクのある作品。現在の配信・視聴条件はリンク先で確認できます。'}</p>
      <div className="streaming-guide__productions">{plays.map((play, index) => <Link className="streaming-production" key={play.slug} href={prefix + '/plays/' + play.slug}><span className="watch-production-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span><strong>{en ? getEnglishPlayTitle(play) : play.title}</strong></span><span className="watch-arrow" aria-hidden="true">→</span></Link>)}</div>
      {linked.length > plays.length ? <Link className="watch-button watch-button--outline" href={listing}>{en ? 'Browse all linked productions' : '配信リンクのある作品をすべて見る'}<span aria-hidden="true">→</span></Link> : null}
    </> : <div className="streaming-guide__empty"><ArchiveIcon name="theatre"/><p>{en ? 'Find your production in the official catalogue. Individual links are still being collected here.' : '見たい舞台は公式の作品一覧へ。作品ごとのリンクは現在収集中です。'}</p></div>}
    {item ? <a className={`watch-button${plays.length ? ' watch-button--light' : ''}`} data-streaming-placement="watch_catalogue" href={item.catalogueUrl} target="_blank" rel="noopener noreferrer">{en ? `Browse ${serviceName(item)}’s catalogue` : `${serviceName(item)}の公式作品一覧へ`}<span aria-hidden="true">↗</span></a> : null}
  </section>;
  return <main className={`container streaming-guide editorial-watch${item ? ' editorial-watch--service' : ''}`} data-streaming-placement="watch_content">
    <StructuredData data={buildBreadcrumbList(breadcrumbs)}/><StructuredData data={{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(faq=>({'@type':'Question',name:faq.q,acceptedAnswer:{'@type':'Answer',text:faq.a}}))}}/>
    <Breadcrumbs items={breadcrumbs.slice(1).map(crumb=>({label:crumb.name,href:crumb.path}))}/>
    <section className="streaming-guide__hero" data-streaming-placement="watch_hero">
      <div className="watch-hero-copy"><h1>{item ? serviceName(item) : en ? <>Find your stage.<br/>On screen.</> : <>見たい舞台の<br/>配信を探す。</>}</h1>
        {item ? <><p>{item[locale].intro}</p><div className="watch-hero-actions"><Link className="watch-button" href="#productions" prefetch={false}>{en ? 'Find a production' : '作品を探す'}<span aria-hidden="true">↓</span></Link><Link className="watch-text-link" href="#plans" prefetch={false}>{en ? 'Plans & trial' : '料金・無料体験'} <span aria-hidden="true">↓</span></Link></div></> : null}
      </div>
      <div className="watch-art" aria-hidden="true"><svg viewBox="0 0 320 280" fill="none"><path className="watch-art-frame" d="M26 35h268v186H26z" stroke="currentColor"/><path d="M42 237h236M68 251h184" stroke="currentColor"/><path d="M40 48h58c0 58-19 95-58 109V48Zm240 0h-58c0 58 19 95 58 109V48Z" fill="currentColor"/><path d="m133 48-47 153h148L187 48" stroke="currentColor"/><path d="M58 204h204M75 212h170" stroke="currentColor"/><path d="M10 16h28M24 2v28M282 260h28M296 246v28" stroke="currentColor"/><circle cx="273" cy="52" r="4" fill="currentColor"/></svg></div>
      <DirectorySearchForm className="streaming-guide__search" action={prefix + '/plays'}><input type="hidden" name="streaming" value="available"/><label className="sr-only" htmlFor="streaming-query">{en ? 'Production or series name' : '作品名・シリーズ名'}</label><input id="streaming-query" name="q" placeholder={en ? 'Search productions or series' : '作品名・シリーズ名で探す'} maxLength={200}/><label className="sr-only" htmlFor="streaming-service">{en ? 'Streaming service' : '配信サービス'}</label><select id="streaming-service" name="service" defaultValue={service ?? ''}><option value="">{en ? 'All services' : 'すべてのサービス'}</option>{STREAMING_GUIDES.map(entry => <option key={entry.id} value={entry.id}>{serviceName(entry)}</option>)}</select><button type="submit" aria-label={en ? 'Search productions with streaming links' : '配信リンクのある作品を検索'}>→</button></DirectorySearchForm>
    </section>
    {item ? <nav className="streaming-guide__tabs" aria-label={en ? 'Streaming services' : '配信サービス'}><Link href={prefix + '/watch'}>{en ? 'All services' : 'すべて'}</Link>{STREAMING_GUIDES.map(entry => <Link key={entry.id} href={streamingGuidePath(locale, entry.id)} aria-current={service === entry.id ? 'page' : undefined}>{serviceName(entry)}</Link>)}</nav> : null}
    {item ? <>{productions}{plans}</> : <>{plans}{productions}</>}
    {item?.signupUrl ? <section className="streaming-guide__signup" data-streaming-placement="watch_signup"><div><h2>{en ? 'Ready to watch?' : '観たい公演が見つかったら。'}</h2><p>{en ? 'Check the recording and whether it is included, then review DMM Premium membership and trial conditions.' : '公演回と見放題対象を確かめて、DMMプレミアムの登録・無料体験へ。'}</p></div><a className="watch-button" href={item.signupUrl} target="_blank" rel="sponsored noopener noreferrer">{en ? 'DMM Premium membership details' : 'DMMプレミアムの登録条件を見る'}<span aria-hidden="true">↗</span></a><small>{en ? 'Ad · Affiliate link' : '広告・アフィリエイトリンク'}</small></section> : null}
    <section className="watch-section watch-faq"><h2>{en ? 'Before you watch' : '視聴前のQ&A'}</h2><div className="faq-grid">{faqs.map(faq => <details className="faq-card" key={faq.q}><summary className="faq-question">{faq.q}<span aria-hidden="true">＋</span></summary><p className="faq-answer">{faq.a}</p></details>)}</div></section>
    <details className="streaming-guide__sources" data-streaming-placement="watch_sources"><summary>{en ? 'Official sources' : '参照した公式情報'}<span aria-hidden="true">＋</span></summary><p>{en ? 'Plan details reviewed on ' + STREAMING_REVIEWED_ON + '. Check current conditions before subscribing.' : `${STREAMING_REVIEWED_ON}時点の公式情報を確認しています。お申し込み時は最新の条件をご確認ください。`}</p><ul>{shownServices.flatMap(entry => entry.sources.map((url, index) => {const labels = entry.id === 'unext' ? (en ? ['Pricing','Free trial','Apple Account billing'] : ['料金','無料トライアル','Apple Account課金']) : (en ? ['Pricing and trial','Price change notice'] : ['料金・無料体験','料金改定のお知らせ']);return <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{serviceName(entry)} · {labels[index]} <span aria-hidden="true">↗</span></a></li>;}))}</ul></details>
  </main>;
}
