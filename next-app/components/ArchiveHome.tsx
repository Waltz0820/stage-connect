import Link from 'next/link';
import { getEnglishSeriesName } from '../lib/en-copy';
import { getGuideList, getHomeStats, getSeriesList } from '../lib/stage-connect';
import { ArchiveHomeMotion } from './ArchiveHomeMotion';
import { ArchiveHeroTexture } from './ArchiveHeroTexture';
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
  const quickSeries = [
    { slug: 'touken-ranbu-musical', ja: '刀ミュ', en: 'TOUMYU' },
    { slug: 'tennimu', ja: 'テニミュ', en: 'TENIMYU' },
    { slug: 'bleach', ja: 'BLEACH', en: 'BLEACH' },
    { slug: 'haikyu', ja: 'ハイキュー!!', en: 'HAIKYU!!' },
    { slug: 'a3', ja: 'A3!', en: 'A3!' },
    { slug: 'butai-touken-ranbu', ja: '刀ステ', en: 'TOUSUTE' },
  ].filter(item => series.some(entry => entry.slug === item.slug));

  return <main className="editorial-home">
    <ArchiveHomeMotion/>
    <section className="archive-hero">
      <ArchiveHeroTexture/>
      <div className="archive-hero__overline"><span>2.5D STAGE ARCHIVE</span><span>DISCOVER / TRACE / CONNECT</span></div>
      <div id="archive-wordmark" className="archive-wordmark" aria-hidden="true">
        <span className="archive-wordmark__line"><span className="archive-wordmark__ink">STAGE</span></span>
        <span className="archive-wordmark__line"><span className="archive-wordmark__ink">CONNECT</span></span>
      </div>
      <h1>{en ? <>Explore 2.5D theatre.{' '}<br/>Find your next production.</> : <>2.5次元舞台を<br/>もっと深く。</>}</h1>
      <p className="archive-hero__description">{en ? 'Find casts, credits and streams through actors, productions and series.' : <><span className="copy-phrase">俳優・作品・シリーズから</span><span className="copy-phrase">配役や出演歴、配信情報を探せます。</span></>}</p>
      <SearchBarClient variant="hero"/>
      <nav className="archive-quick-series" aria-label={en ? 'Featured series' : 'シリーズからすぐ探す'}>
        {quickSeries.map(item => <Link key={item.slug} href={`${prefix}/series/${item.slug}`}>{item[locale]}</Link>)}
      </nav>
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
      <div className="archive-section__heading" data-reveal="heading"><div><span className="archive-kicker">01 / SERIES</span><h2 id="home-series-heading">{en ? 'Explore series' : 'シリーズから探す'}</h2><p>{en ? 'Explore productions and casts across each series.' : '歴代公演と出演キャストをまとめて見る。'}</p></div><Link href={prefix + '/series'}>{en ? 'View all' : 'すべて見る'} <span aria-hidden="true">↗</span></Link></div>
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
      <div className="archive-section__heading" data-reveal="heading"><div><span className="archive-kicker">03 / GUIDE &amp; EDITORIAL</span><h2 id="home-guide-heading">{en ? 'Enjoy more theatre' : '舞台をもっと楽しむ'}</h2><p>{en ? 'Highlights and viewing guides. Available in Japanese.' : '作品の見どころや観る順番を紹介。'}</p></div><Link href="/guide">{en ? 'All guides' : 'ガイド一覧'} <span aria-hidden="true">↗</span></Link></div>
      <div className="archive-guides__list">{guides.map((guide, index) => <Link key={guide.slug} href={'/guide/' + guide.slug} className="archive-guide" data-reveal="guide">
        <span className="archive-guide__number">GUIDE {String(index + 1).padStart(3, '0')}{en ? ' / 日本語' : guide.category === 'series-guides' ? ' / シリーズガイド' : ''}</span>
        <strong lang="ja">{guide.title}</strong><span className="archive-guide__bottom"><span>{en ? 'Read the guide (Japanese)' : 'ガイドを読む'}</span><span aria-hidden="true">↗</span></span>
      </Link>)}</div>
    </section> : null}

    <section className="archive-home-streaming" aria-label={en ? 'Explore streaming options' : '配信で観られる作品'}>
      <Link className="archive-streaming-link" data-streaming-placement="home_banner" href={prefix + '/watch/dmm'}>
        <strong>DMM TV</strong><span>{en ? 'Browse stage streaming links' : '舞台の配信情報を見る'}</span><span aria-hidden="true">→</span>
      </Link>
    </section>
  </main>;
}
