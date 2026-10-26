import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from './Breadcrumbs';
import { StructuredData } from './StructuredData';
import { buildBreadcrumbList } from '../lib/structured-data';
import { STREAMING_GUIDES } from '../lib/streaming-guide';
import { DMM_TV_COPY, DMM_TV_REVIEWED_ON } from '../lib/dmm-tv-copy';
import type { SiteLocale } from '../lib/locale-routing';
import { DmmTvMotion } from './DmmTvMotion';
import '../app/dmm-tv.css';

type DmmIconName = 'phone' | 'pc' | 'tv' | 'calendar' | 'yen' | 'card' | 'download' | 'ticket' | 'play' | 'help';

function DmmIcon({ name }: { name: DmmIconName }) {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'phone' ? <><rect x="11" y="3" width="18" height="34" rx="3"/><path d="M17 7h6m-5 26h4"/></> :
      name === 'pc' ? <><rect x="6" y="7" width="28" height="21" rx="2"/><path d="m6 28-3 5h34l-3-5M17 31h6"/></> :
      name === 'tv' ? <><rect x="3" y="6" width="34" height="24" rx="2"/><path d="M20 30v5m-8 0h16"/></> :
      name === 'calendar' ? <><rect x="6" y="8" width="28" height="28" rx="3"/><path d="M6 16h28M13 4v8m14-8v8M13 23h4m6 0h4m-14 6h4m6 0h4"/></> :
      name === 'yen' ? <><circle cx="20" cy="20" r="17"/><path d="m12 10 8 11 8-11M20 21v10m-7-9h14m-14 5h14"/></> :
      name === 'card' ? <><rect x="3" y="8" width="34" height="25" rx="3"/><path d="M3 16h34M9 26h7"/></> :
      name === 'download' ? <><path d="M20 3v23M11 17l9 9 9-9M5 28v8h30v-8"/></> :
      name === 'ticket' ? <><path d="M5 8h30v9a4 4 0 0 0 0 8v8H5v-8a4 4 0 0 0 0-8Z"/><path d="M26 10v4m0 5v4m0 5v3"/></> :
      name === 'play' ? <><circle cx="20" cy="20" r="17"/><path d="m16 12 13 8-13 8Z" fill="currentColor" stroke="none"/></> :
      <><circle cx="20" cy="20" r="17"/><path d="M14 14a6 6 0 1 1 9 5c-3 1-3 3-3 5m0 5h.01"/></>}
  </svg>;
}

export default function DmmTvLanding({ locale }: { locale: SiteLocale }) {
  const en = locale === 'en', prefix = en ? '/en' : '', copy = DMM_TV_COPY[locale];
  const dmm = STREAMING_GUIDES.find(item => item.id === 'dmm')!;
  const breadcrumbs = [{ name: en ? 'Home' : 'ホーム', path: prefix || '/' }, { name: en ? 'Streaming guide' : '配信ガイド', path: prefix + '/watch' }, { name: 'DMM TV', path: prefix + '/watch/dmm' }];
  const trial = (placement: 'watch_hero' | 'watch_plan' | 'watch_signup') => <a className="dmm-lp__cta" data-streaming-placement={placement} href={dmm.signupUrl} target="_blank" rel="sponsored noopener noreferrer">{dmm.trialDays}{copy.tryLabel}<span aria-hidden="true">→</span></a>;
  const price = <span className="dmm-lp__price">{copy.monthly}{en ? '¥' : ''}<strong>{dmm.monthlyYen}</strong>{copy.yen}<small>（{copy.web}）</small></span>;
  const productions = (params: Record<string, string> = {}) => `${prefix}/plays?${new URLSearchParams({ streaming: 'available', service: 'dmm', ...params })}`;
  const title = (lines: readonly string[]) => lines.map(line => <span className="dmm-lp__headline-line" key={line}>{line}</span>);

  return <main className="dmm-tv-landing" data-streaming-placement="watch_content">
    <DmmTvMotion/>
    <StructuredData data={buildBreadcrumbList(breadcrumbs)}/>
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: copy.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) }}/>

    <section className="dmm-lp__hero" aria-labelledby="dmm-hero-title">
      <div className="dmm-lp__hero-scene">
        <Image className="dmm-lp__hero-image" src="/images/dmm-tv/theatre-night.webp" alt="" fill sizes="(min-width: 900px) 65vw, 100vw" priority/>
        <div className="dmm-lp__hero-copy">
          <Breadcrumbs items={breadcrumbs.slice(1).map(crumb => ({ label: crumb.name, href: crumb.path }))}/>
          <h1 id="dmm-hero-title"><span className="dmm-lp__brand">DMM TV<small>{copy.withDmm}</small></span>{title(copy.hero)}</h1>
        </div>
      </div>
      <div className="dmm-lp__hero-offer">
        <p className="dmm-lp__hero-tag">{copy.heroTag}</p>
        <p className="dmm-lp__hero-lead"><strong>DMM TV</strong><span>{copy.heroLead}</span></p>
        <div className="dmm-lp__offer-panel">
          {price}<p className="dmm-lp__trial">{copy.first}<strong>{dmm.trialDays}</strong>{copy.free}</p>
          {trial('watch_hero')}<small className="dmm-lp__cancel-note">{copy.cancelNote}</small>
        </div>
      </div>
    </section>

    <section className="dmm-lp__enjoy dmm-lp__section" aria-labelledby="dmm-enjoy-title">
      <div className="dmm-lp__section-heading" data-dmm-reveal="heading"><h2 id="dmm-enjoy-title">{title(copy.enjoy)}</h2><p>{title(copy.enjoyText)}</p></div>
      <div className="dmm-lp__viewings">{copy.viewings.map((view, index) => <article className="dmm-lp__viewing" key={view.image} data-dmm-reveal="viewing">
        <span className="dmm-lp__number" aria-hidden="true">0{index + 1}</span>
        <div className="dmm-lp__viewing-art"><Image src={`/images/dmm-tv/${view.image}.webp`} alt="" width={960} height={720} sizes="(min-width: 900px) 130px, 100px"/></div>
        <div className="dmm-lp__viewing-copy"><h3>{view.title}</h3><p>{view.text}</p></div>
      </article>)}</div>
    </section>

    <section className="dmm-lp__discovery" aria-labelledby="dmm-discovery-title">
      <div className="dmm-lp__discovery-art"><Image className="dmm-lp__discovery-image" src="/images/dmm-tv/discovery-smile.webp" alt="" fill sizes="(min-width: 900px) 55vw, 100vw"/></div>
      <div className="dmm-lp__discovery-copy" data-dmm-reveal="copy">
        <h2 id="dmm-discovery-title">{title(copy.discovery)}</h2><p>{title(copy.discoveryText)}</p>
      </div>
      <Link className="dmm-lp__internal" href={prefix + '/actors'}>{copy.discoverLink}<span aria-hidden="true">→</span></Link>
    </section>

    <section className="dmm-lp__series dmm-lp__section" aria-labelledby="dmm-series-title">
      <div className="dmm-lp__section-heading" data-dmm-reveal="heading"><h2 id="dmm-series-title">{copy.seriesHeading}</h2><p>{copy.seriesIntro}</p></div>
      <div className="dmm-lp__series-cards">{copy.series.map(series => <article className="dmm-lp__series-card" key={series.image} data-dmm-reveal="series">
        <Image src={`/images/dmm-tv/${series.image}.webp`} alt="" fill sizes="(min-width: 900px) 45vw, 100vw"/>
        <div><h3>{series.title}<span>（{series.short}）</span></h3><p>{series.text}</p><Link className="dmm-lp__outline" href={productions({ series: series.filter })}>{copy.seeProductions}<span aria-hidden="true">›</span></Link></div>
      </article>)}</div>
      <nav className="dmm-lp__more-series" aria-label={copy.moreSeries}>{copy.otherSeries.map(series => <Link href={productions({ q: series.query })} key={series.query}>{series.label}<span aria-hidden="true">›</span></Link>)}<Link href={productions()}>{copy.moreSeries}<span aria-hidden="true">→</span></Link></nav>
    </section>

    <section className="dmm-lp__plan dmm-lp__section" aria-labelledby="dmm-plan-title">
      <div className="dmm-lp__plan-offer">
        <div className="dmm-lp__section-heading" data-dmm-reveal="heading"><h2 id="dmm-plan-title">{title(copy.priceHeading)}</h2><p>{copy.priceIntro}</p></div>
        <div className="dmm-lp__membership" data-dmm-reveal="membership"><div><DmmIcon name="ticket"/><strong>{copy.premium}</strong><small>{copy.premiumDetail}</small></div><span aria-hidden="true">→</span><div><DmmIcon name="play"/><strong>DMM TV</strong><small>{copy.included}</small></div></div>
        <div className="dmm-lp__plan-trial"><p className="dmm-lp__trial">{copy.first}<strong>{dmm.trialDays}</strong>{copy.free}</p><p>{copy.trialText}</p>{trial('watch_plan')}<p className="dmm-lp__conditions">{copy.conditions}</p><small className="dmm-lp__ad">{copy.ad}</small></div>
      </div>
      <div className="dmm-lp__comparison" data-dmm-reveal="comparison"><h3>{copy.comparison}</h3><div className="dmm-lp__comparison-cards"><article><h4>{copy.subscription}</h4><p>{copy.subscriptionText}</p><Image src="/images/dmm-tv/story.webp" alt="" width={960} height={720} sizes="(min-width: 900px) 220px, 40vw"/></article><article><h4>{copy.rental}</h4><p>{copy.rentalText}</p><DmmIcon name="ticket"/></article></div><p className="dmm-lp__catalogue-note">{copy.catalogueNote}</p></div>
    </section>

    <section className="dmm-lp__devices dmm-lp__section" aria-labelledby="dmm-devices-title">
      <div className="dmm-lp__section-heading" data-dmm-reveal="heading"><h2 id="dmm-devices-title">{title(copy.devicesHeading)}</h2><p>{copy.devicesIntro}</p></div>
      <div className="dmm-lp__devices-content"><Image className="dmm-lp__devices-image" src="/images/dmm-tv/watch-anywhere.webp" alt="" width={1400} height={934} sizes="(min-width: 900px) 50vw, 100vw"/>
        <div><div className="dmm-lp__device-list">{copy.devices.map(device => <div key={device.icon}><DmmIcon name={device.icon}/><h3>{device.title}</h3><p>{device.text}</p>{device.detail ? <small>{device.detail}</small> : null}</div>)}</div><a className="dmm-lp__outline" href="https://support.dmm.com/dmm-tv/article/47590" target="_blank" rel="noopener noreferrer">{copy.deviceLink}<span aria-hidden="true">›</span></a></div>
      </div>
    </section>

    <section className="dmm-lp__support dmm-lp__section" aria-labelledby="dmm-support-title">
      <div className="dmm-lp__section-heading" data-dmm-reveal="heading"><h2 id="dmm-support-title">{title(copy.supportHeading)}</h2><p>{copy.supportIntro}</p></div>
      <div className="dmm-lp__faqs">{copy.faqs.map(faq => <details className="dmm-lp__faq" key={faq.q}><summary><DmmIcon name={faq.icon}/><span className="dmm-lp__faq-label"><strong>{faq.q}</strong><small>{faq.preview}</small></span><span className="dmm-lp__faq-toggle" aria-hidden="true">＋</span></summary><p>{faq.a}</p></details>)}</div>
      <a className="dmm-lp__outline" href="https://support.dmm.com/dmm-tv" target="_blank" rel="noopener noreferrer">{copy.moreHelp}<span aria-hidden="true">›</span></a>
    </section>

    <section className="dmm-lp__closing" aria-labelledby="dmm-closing-title">
      <Image src="/images/dmm-tv/theatre-night.webp" alt="" fill sizes="100vw"/>
      <div className="dmm-lp__closing-copy"><h2 id="dmm-closing-title" data-dmm-reveal="heading">{title(copy.closing)}</h2><p className="dmm-lp__closing-intro">{title(copy.closingText)}</p>
        <div className="dmm-lp__closing-actions">{trial('watch_signup')}{price}<p className="dmm-lp__conditions">{copy.conditions}</p><small className="dmm-lp__ad">{copy.ad}</small></div>
        <Link className="dmm-lp__listing" href={productions()}>{copy.listing}<span aria-hidden="true">→</span></Link>
      </div>
    </section>

    <details className="dmm-lp__notes dmm-lp__section" data-streaming-placement="watch_sources"><summary>{copy.notes}<span aria-hidden="true">＋</span></summary><div className="dmm-lp__notes-content"><p>{copy.pricingDetail}</p><p><a href={dmm.officialUrl} target="_blank" rel="noopener noreferrer">{copy.official} ↗</a></p><p>{copy.reviewed}：<time dateTime={DMM_TV_REVIEWED_ON}>{DMM_TV_REVIEWED_ON}</time></p></div></details>
  </main>;
}
