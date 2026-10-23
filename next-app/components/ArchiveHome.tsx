import Link from 'next/link';
import { getEnglishSeriesName } from '../lib/en-copy';
import { getGuideList, getHomeStats, getSeriesList } from '../lib/stage-connect';
import { ArchiveHomeMotion } from './ArchiveHomeMotion';
import { OshiDiscoveryLinks } from './OshiPoints';
import { SearchBarClient } from './SearchBarClient';

// Display labels only. Entity names, order, counts and destinations come from the archive.
const shortNames: Record<string, { ja: string; en: string }> = {
  'touken-ranbu-musical': { ja: '刀ミュ', en: 'TOUMYU' },
  'butai-touken-ranbu': { ja: '刀ステ', en: 'TOUSUTE' },
  tennimu: { ja: 'テニミュ', en: 'TENIMYU' },
  'tennimu-2nd': { ja: 'テニミュ 2nd', en: 'TENIMYU 2nd' },
  bleach: { ja: 'BLEACH', en: 'BLEACH' },
};

export default async function ArchiveHome({ locale }: { locale: 'ja' | 'en' }) {
  const [stats, series, guides] = await Promise.all([getHomeStats(), getSeriesList(), getGuideList()]);
  const en = locale === 'en';
  const prefix = en ? '/en' : '';
  const actions = [
    { href: '/actors', word: 'ACTORS', title: en ? 'Browse actors' : '俳優を探す', text: en ? 'Credits, roles and co-stars' : '出演作品・役柄・共演者から' },
    { href: '/plays', word: 'PLAYS', title: en ? 'Browse plays' : '作品を探す', text: en ? 'Performances, casts and streaming' : '公演情報・キャスト・配信から' },
    { href: '/series', word: 'SERIES', title: en ? 'Browse series' : 'シリーズを探す', text: en ? 'Follow each series through its history' : '歴代公演・シリーズの流れから' },
  ];
  const counts = [
    { label: en ? 'Actors' : '俳優', value: stats.actorCount },
    { label: en ? 'Works' : '作品', value: stats.playCount },
    { label: en ? 'Series' : 'シリーズ', value: series.length },
  ];

  return <main className="editorial-home">
    <ArchiveHomeMotion/>
    <section className="archive-hero">
      <div className="archive-hero__overline"><span>2.5D STAGE ARCHIVE</span><span>DISCOVER / TRACE / CONNECT</span></div>
      <div id="archive-wordmark" className="archive-wordmark" aria-hidden="true">
        <span className="archive-wordmark__line"><span className="archive-wordmark__ink">STAGE</span></span>
        <span className="archive-wordmark__line"><span className="archive-wordmark__ink">CONNECT</span></span>
      </div>
      <div className="archive-hero__art" aria-hidden="true">
        <svg viewBox="0 0 420 350" fill="none" focusable="false">
          <g className="archive-hero__edges" stroke="currentColor" strokeWidth="1.5"><path d="m91 88 229 48-108 143L91 88Z"/><path d="m91 88 19 211 102-20M320 136l55 118-163 25"/></g>
          <g className="archive-hero__node archive-hero__node--actor"><circle cx="91" cy="88" r="60" fill="#315cff"/><circle cx="91" cy="77" r="14" stroke="white" strokeWidth="2"/><path d="M65 113q0-25 26-25t26 25" stroke="white" strokeWidth="2"/><text x="91" y="175" textAnchor="middle">ACTORS</text></g>
          <g className="archive-hero__node archive-hero__node--play"><path d="m269 74 112 14-14 112-112-14z" fill="#ff725e"/><path d="m307 115 31 23-36 15z" stroke="currentColor" strokeWidth="2"/><text x="320" y="226" textAnchor="middle">PLAYS</text></g>
          <g className="archive-hero__node archive-hero__node--series"><circle cx="212" cy="279" r="55" fill="#e0f16a"/><path d="m183 269 29-15 29 15-29 15-29-15Zm0 13 29 15 29-15m-58 13 29 15 29-15" stroke="currentColor" strokeWidth="2"/><text x="212" y="347" textAnchor="middle">SERIES</text></g>
          <g fill="currentColor"><circle cx="110" cy="299" r="4"/><circle cx="375" cy="254" r="4"/><path d="M391 45v16m-8-8h16" stroke="currentColor" strokeWidth="1.5"/></g>
        </svg>
      </div>
      <h1>{en ? 'Explore the stage. Discover more to love.' : '2.5次元舞台の、好きな作品をもっと深く。'}</h1>
      <p className="archive-hero__description">{en ? 'Explore actors, productions and series in a connected digital archive of 2.5D theatre.' : '俳優・作品・シリーズを横断して探せる、2.5次元舞台のデジタルアーカイブ。'}</p>
      <SearchBarClient variant="hero"/>
      <div className="archive-stats" aria-label={en ? 'Archive totals' : 'アーカイブの登録件数'}>
        {counts.map(({ label, value }) => <div key={label}><strong>{value.toLocaleString(en ? 'en-US' : 'ja-JP')}</strong><span>{label}</span></div>)}
      </div>
      <div className="archive-hero__bottom"><span>EXPLORE THE ARCHIVE</span><Link href="#archive-pathways" prefetch={false} aria-label={en ? 'Explore categories' : 'カテゴリーへスクロール'}>↓</Link></div>
    </section>

    <nav id="archive-pathways" className="archive-pathways" aria-label={en ? 'Explore the archive' : 'コンテンツを探す'}>
      <span className="archive-pathways__trace" aria-hidden="true"/>
      {actions.map(item => <Link key={item.href} href={prefix + item.href} className="archive-pathway" data-reveal="path">
        <span><span className="archive-pathway__word">{item.word}</span><span className="archive-pathway__title">{item.title}</span><span className="archive-pathway__description">{item.text}</span></span><span className="archive-pathway__arrow" aria-hidden="true">→</span>
      </Link>)}
    </nav>

    <section className="archive-section archive-series" aria-labelledby="home-series-heading">
      <div className="archive-section__heading" data-reveal="heading"><div><span className="archive-kicker">01 / SERIES</span><h2 id="home-series-heading">{en ? 'Explore series' : 'シリーズから探す'}</h2><p>{en ? 'Follow the world of each production.' : '作品の世界を、シリーズから辿る。'}</p></div><Link href={prefix + '/series'}>{en ? 'View all' : 'すべて見る'} <span aria-hidden="true">↗</span></Link></div>
      <div className="archive-series__grid">
        {series.slice(0, 4).map(item => <Link key={item.slug} href={prefix + '/series/' + item.slug} className="archive-series__tile" data-reveal="series">
          <span className="archive-series__top"><span>{item.format === 'musical' ? 'MUSICAL' : item.format === 'stage' ? 'STAGE PLAY' : 'SERIES'}</span><span>{en ? item.playCount + ' works' : item.playCount + '作品'}</span></span>
          <span className="archive-series__names"><strong>{shortNames[item.slug]?.[locale] ?? (en ? getEnglishSeriesName(item) : item.name)}</strong><span>{en ? getEnglishSeriesName(item) : item.name}</span></span>
          <span className="archive-round-arrow" aria-hidden="true">→</span>
        </Link>)}
      </div>
    </section>

    <div className="archive-points"><span className="archive-kicker" data-reveal="heading">02 / DISCOVERY</span><OshiDiscoveryLinks locale={locale}/></div>

    {guides.length > 0 ? <section className="archive-section archive-guides" aria-labelledby="home-guide-heading">
      <div className="archive-section__heading" data-reveal="heading"><div><span className="archive-kicker">03 / GUIDE &amp; EDITORIAL</span><h2 id="home-guide-heading">{en ? 'Enjoy more of the stage.' : '舞台をもっと楽しむ。'}</h2><p>{en ? 'Guides for your next discovery. Available in Japanese.' : 'はじめての人も、もっと深く知りたい人も。'}</p></div><Link href="/guide">{en ? 'All guides' : 'ガイド一覧'} <span aria-hidden="true">↗</span></Link></div>
      <div className="archive-guides__list">{guides.map((guide, index) => <Link key={guide.slug} href={'/guide/' + guide.slug} className="archive-guide" data-reveal="guide">
        <span className="archive-guide__number">GUIDE {String(index + 1).padStart(3, '0')}{en ? ' / 日本語' : guide.category === 'series-guides' ? ' / シリーズガイド' : ''}</span>
        <strong lang="ja">{guide.title}</strong><span className="archive-guide__bottom"><span>{en ? 'Read the guide (Japanese)' : 'ガイドを読む'}</span><span aria-hidden="true">↗</span></span>
      </Link>)}</div>
    </section> : null}

    <section className="archive-home-streaming" aria-label={en ? 'Explore streaming options' : '配信で観られる作品'}>
      <Link className="archive-streaming-link" data-streaming-placement="home_banner" href={prefix + '/watch/dmm'}>
        <strong>DMM TV</strong><span>{en ? 'Find streaming information for your next production' : '気になる作品の配信情報をチェック'}</span><span aria-hidden="true">→</span>
      </Link>
    </section>
  </main>;
}
