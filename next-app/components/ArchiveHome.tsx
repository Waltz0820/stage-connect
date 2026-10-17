import { getImageProps } from 'next/image';
import Link from 'next/link';
import { getEnglishSeriesName } from '../lib/en-copy';
import { getHomeStats, getSeriesList } from '../lib/stage-connect';
import { ArchiveIcon, SeriesMotif } from './ArchiveIcon';
import { OshiDiscoveryLinks } from './OshiPoints';

const heroImageOptions = { alt: '', fill: true, sizes: '100vw', quality: 85, loading: 'eager' as const, fetchPriority: 'high' as const };
const desktopHero = getImageProps({ ...heroImageOptions, src: '/stage-hero-v2.png' }).props;
const mobileHero = getImageProps({ ...heroImageOptions, src: '/stage-hero-mobile-v2.png' }).props;

export default async function ArchiveHome({ locale }: { locale: 'ja' | 'en' }) {
  const [stats, series] = await Promise.all([getHomeStats(), getSeriesList()]);
  const en = locale === 'en';
  const prefix = en ? '/en' : '';
  const actions = [
    { href: '/actors', icon: 'actor' as const, title: en ? 'Browse actors' : '俳優を探す', text: en ? 'Profiles, credits, and cast connections' : '出演作・プロフィール・つながりから探す' },
    { href: '/plays', icon: 'play' as const, title: en ? 'Browse plays' : '作品を探す', text: en ? 'Productions, casts, and streaming links' : '舞台作品・キャスト・配信情報を探す' },
    { href: '/series', icon: 'series' as const, title: en ? 'Browse series' : 'シリーズを探す', text: en ? 'Find a world you want to explore' : '気になるシリーズから作品を探す' },
  ];
  const counts = [
    { label: en ? 'Actors' : '俳優', value: stats.actorCount },
    { label: en ? 'Works' : '作品', value: stats.playCount },
    { label: en ? 'Series' : 'シリーズ', value: series.length },
  ];

  return <main className="home-shell home-shell--theatre">
    <section className="home-stage">
      <div className="home-stage__grid">
        <div className="home-stage__hero">
          <picture className="home-stage__image" aria-hidden="true">
            <source media="(max-width: 719px)" srcSet={mobileHero.srcSet} sizes="100vw"/>
            <img {...desktopHero}/>
          </picture>
          <div className="home-stage__scrim" aria-hidden="true"/>
          <div className="home-stage__hero-copy">
            <h1 className="home-stage__title">{en ? <>Discover 2.5D theatre.<br/>Connect through the cast.</> : <>2.5次元舞台と<br/>キャストをつなぐ</>}</h1>
            <p className="home-stage__lead">{en ? <>Productions, series, cast history, and streaming.<br/>One connected archive for the world of 2.5D theatre.</> : <>作品・シリーズ・出演者・配信情報を横断して追える。<br/>2.5次元舞台に特化したデジタルアーカイブ。</>}</p>
          </div>
        </div>

        <form className="v2-search home-search" action={`${prefix}/search`}>
          <label className="sr-only" htmlFor="home-query">{en ? 'Search plays, actors and series' : '作品・俳優・シリーズを検索'}</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input id="home-query" name="q" placeholder={en ? 'Search plays, actors and series' : '作品名・俳優名・シリーズ名で検索'}/>
          <button type="submit" aria-label={en ? 'Search' : '検索'}>→</button>
        </form>

        <div className="home-stage__stats">
          {counts.map(({label, value}) => <div className="home-stage__stat" key={label}><span className="home-stage__stat-label">{label}</span><strong>{value.toLocaleString(en ? 'en-US' : 'ja-JP')}</strong></div>)}
        </div>

        <div className="home-stage__actions">
          {actions.map(item => <Link key={item.href} href={`${prefix}${item.href}`} className="home-stage__action">
            <span className="home-stage__action-icon"><ArchiveIcon name={item.icon}/></span>
            <span className="home-stage__action-copy"><span className="home-stage__action-title">{en ? item.title : <><span>{item.title.replace('を探す', '')}</span><span>を探す</span></>}</span><span className="home-stage__action-text">{item.text}</span></span>
            <span className="home-stage__action-arrow" aria-hidden="true">→</span>
          </Link>)}
        </div>

        <section className="home-stage__section home-stage__section--open">
          <div className="home-stage__section-head">
            <h2>{en ? 'Explore series' : 'シリーズから探す'}</h2>
            <Link href={`${prefix}/series`}>{en ? 'View all' : 'すべて見る'} <span aria-hidden="true">→</span></Link>
          </div>
          <div className="home-stage__series-grid">
            {series.slice(0,4).map(item => <Link key={item.slug} href={`${prefix}/series/${item.slug}`} className="home-stage__series-card">
              <span className="home-stage__series-motif"><SeriesMotif slug={item.slug} format={item.format}/></span>
              <div className="home-stage__series-copy"><strong>{en ? getEnglishSeriesName(item) : item.name}</strong></div>
              <span className="home-stage__series-arrow" aria-hidden="true">→</span>
              <span className="home-stage__series-meta">{item.format === 'musical' ? (en ? 'Musical' : 'ミュージカル') : item.format === 'stage' ? (en ? 'Stage' : '舞台') : (en ? 'Series' : 'シリーズ')}<span aria-hidden="true">｜</span>{en ? `${item.playCount} ${item.playCount === 1 ? 'work' : 'works'}` : `${item.playCount}作品`}</span>
            </Link>)}
          </div>
        </section>

        <section className="home-streaming" aria-label={en ? 'Explore streaming options' : '配信で観られる作品'}>
          <Link className="home-streaming__banner" data-streaming-placement="home_banner" href="/watch/dmm">
            <span className="home-streaming__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7Z"/></svg></span>
            <strong>DMM TV</strong>
            <span className="home-streaming__copy"><span>{en ? 'Find streaming information for your next production' : '気になる作品の配信情報をチェック'}</span><small>{en ? 'Explore 2.5D theatre, whenever you like.' : '2.5次元舞台作品を、いつでもどこでも。'}</small></span>
            <span className="home-streaming__link">{en ? 'Explore streaming' : '配信情報を見る'} <span aria-hidden="true">→</span></span>
          </Link>
        </section>

        <OshiDiscoveryLinks locale={locale}/>
      </div>
    </section>
  </main>;
}
