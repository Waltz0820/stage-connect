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

function BenefitIcon({ name }: { name: 'play' | 'yen' | 'devices' }) {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    {name === 'play' ? <path d="m15 10 16 10-16 10Z" fill="currentColor"/> : name === 'yen' ? <path d="m11 8 9 12L29 8M20 20v13M12 22h16M12 27h16" stroke="currentColor" strokeWidth="2"/> : <><rect x="5" y="8" width="25" height="18" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M17 26v6m-6 0h13" stroke="currentColor" strokeWidth="1.5"/><rect x="26" y="17" width="9" height="17" rx="1" fill="var(--ed-night)" stroke="currentColor" strokeWidth="1.5"/></>}
  </svg>;
}

function CreditsArtwork() {
  return <svg className="dmm-lp__credits-art" viewBox="0 0 160 140" aria-hidden="true">
    <g transform="translate(18 15) rotate(-10 35 50)"><rect width="64" height="104" rx="9" fill="#151f42"/><circle cx="32" cy="25" r="12" fill="#bbd2ff"/><path d="M20 28q12-16 24 0v11H20Z" fill="#7895e0"/><path d="M15 56h34M15 65h26M15 83h34" stroke="#d8e4ff" strokeWidth="4" strokeLinecap="round"/></g>
    <g transform="translate(82 24) rotate(9 28 48)"><rect width="58" height="96" rx="8" fill="#315cff"/><rect x="9" y="14" width="40" height="26" rx="2" fill="#b5caff"/><path d="M13 56h32M13 65h22M13 81h29" stroke="white" strokeWidth="4" strokeLinecap="round"/></g>
  </svg>;
}

export default function DmmTvLanding({ locale }: { locale: SiteLocale }) {
  const en = locale === 'en', prefix = en ? '/en' : '', copy = DMM_TV_COPY[locale];
  const dmm = STREAMING_GUIDES.find(item => item.id === 'dmm')!;
  const breadcrumbs = [{ name: en ? 'Home' : 'ホーム', path: prefix || '/' }, { name: en ? 'Streaming guide' : '配信ガイド', path: prefix + '/watch' }, { name: 'DMM TV', path: prefix + '/watch/dmm' }];
  const trial = (placement: 'watch_hero' | 'watch_signup') => <a className="dmm-lp__cta" data-streaming-placement={placement} href={dmm.signupUrl} target="_blank" rel="sponsored noopener noreferrer">{dmm.trialDays}{copy.tryLabel}<span aria-hidden="true">→</span></a>;
  const price = <span className="dmm-lp__price">{copy.after} <span>{copy.monthly}{en ? '¥' : ''}<strong>{dmm.monthlyYen}</strong>{copy.yen}</span><small>（{copy.web}）</small></span>;

  return <main className="dmm-tv-landing" data-streaming-placement="watch_content">
    <DmmTvMotion/>
    <StructuredData data={buildBreadcrumbList(breadcrumbs)}/>
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: copy.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) }}/>

    <section className="dmm-lp__hero" aria-labelledby="dmm-hero-title">
      <div className="dmm-lp__hero-inner">
        <div className="dmm-lp__hero-copy">
          <Breadcrumbs items={breadcrumbs.slice(1).map(crumb => ({ label: crumb.name, href: crumb.path }))}/>
          <h1 id="dmm-hero-title"><span className="dmm-lp__brand">DMM TV<small>{copy.withDmm}</small></span>{copy.hero.map(line => <span className="dmm-lp__headline-line" key={line}>{line}</span>)}</h1>
          <p className="dmm-lp__intro">{copy.intro.map(line => <span key={line}>{line}</span>)}</p>
          <div className="dmm-lp__hero-actions">{trial('watch_hero')}{price}</div>
          <p className="dmm-lp__conditions">{copy.conditions}</p>
          <small className="dmm-lp__ad">{copy.ad}</small>
        </div>
        <div className="dmm-lp__hero-art" data-dmm-reveal="art" aria-hidden="true"><Image src="/images/dmm-tv/hero.webp" alt="" fill sizes="(min-width: 1000px) 55vw, 100vw" priority/></div>
      </div>
    </section>

    <section className="dmm-lp__enjoy dmm-lp__section" aria-labelledby="dmm-enjoy-title">
      <h2 id="dmm-enjoy-title" data-dmm-reveal="heading">{copy.enjoy.map(line => <span className="copy-phrase" key={line}>{line}</span>)}</h2>
      <div className="dmm-lp__viewings">{copy.viewings.map((view, index) => <article className="dmm-lp__viewing" key={view.image} data-dmm-reveal="viewing">
        <div className="dmm-lp__viewing-copy"><span className="dmm-lp__number" aria-hidden="true">0{index + 1}</span><div><h3>{view.title}</h3><p>{view.text}</p></div></div>
        <div className="dmm-lp__viewing-art"><Image src={`/images/dmm-tv/${view.image}.webp`} alt="" width={960} height={720} sizes="(min-width: 1000px) 30vw, (min-width: 740px) 42vw, 52vw"/></div>
        {index < 2 ? <span className="dmm-lp__viewing-arrow" aria-hidden="true">→</span> : null}
      </article>)}</div>
    </section>

    <section className="dmm-lp__discovery dmm-lp__section" aria-labelledby="dmm-discovery-title">
      <div className="dmm-lp__discovery-copy">
        <h2 id="dmm-discovery-title" data-dmm-reveal="heading">{copy.discovery.map(line => <span className="dmm-lp__headline-line" key={line}>{line}</span>)}</h2>
        <p>{copy.discoveryText.map(line => <span key={line}>{line}</span>)}</p>
        <Link className="dmm-lp__internal" href={prefix + '/actors'}>{copy.discoverLink}<span aria-hidden="true">→</span></Link>
      </div>
      <ol className="dmm-lp__loop">{copy.steps.map((step, index) => <li key={step.title} data-dmm-reveal="step">
        <div className="dmm-lp__step-art">{step.image ? <Image src={`/images/dmm-tv/${step.image}.webp`} alt="" width={960} height={720} sizes="(min-width: 1000px) 140px, 84px"/> : <CreditsArtwork/>}</div>
        <div><h3>{step.title}</h3><p>{step.text}</p></div>{index < 2 ? <span className="dmm-lp__step-arrow" aria-hidden="true">→</span> : null}
      </li>)}</ol>
    </section>

    <section className="dmm-lp__closing dmm-lp__section" aria-labelledby="dmm-closing-title">
      <div className="dmm-lp__closing-copy"><h2 id="dmm-closing-title" data-dmm-reveal="heading">{copy.closing.map(line => <span className="dmm-lp__headline-line" key={line}>{line}</span>)}</h2><p className="dmm-lp__closing-intro">{copy.closingText}</p>
        <p className="dmm-lp__trial"><span aria-hidden="true">✓</span>{copy.first} <strong>{dmm.trialDays}</strong>{copy.free}</p>
        <div className="dmm-lp__closing-price">{price}</div>
        {trial('watch_signup')}
        <p className="dmm-lp__conditions">{copy.conditions}</p><small className="dmm-lp__ad">{copy.ad}</small>
      </div>
      <div className="dmm-lp__closing-more"><div className="dmm-lp__benefits">{copy.benefits.map(benefit => <div key={benefit.icon}><span className="dmm-lp__benefit-icon"><BenefitIcon name={benefit.icon}/></span><h3>{benefit.title}</h3><p>{benefit.text}</p></div>)}</div>
        <Link className="dmm-lp__listing" href={`${prefix}/plays?streaming=available&service=dmm`}>{copy.listing}<span aria-hidden="true">→</span></Link>
      </div>
    </section>

    <details className="dmm-lp__notes dmm-lp__section" data-streaming-placement="watch_sources"><summary>{copy.notes}<span aria-hidden="true">＋</span></summary><div className="dmm-lp__notes-content"><p>{copy.pricingDetail}</p>{copy.faqs.map(faq => <div key={faq.q}><h3>{faq.q}</h3><p>{faq.a}</p></div>)}<p><a href={dmm.officialUrl} target="_blank" rel="noopener noreferrer">{copy.official}<span aria-hidden="true"> ↗</span></a></p><p>{copy.reviewed}：<time dateTime={DMM_TV_REVIEWED_ON}>{DMM_TV_REVIEWED_ON}</time></p></div></details>
  </main>;
}
