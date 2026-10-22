import Link from 'next/link';
import { DirectorySearchForm } from './DirectorySearchForm';
import { searchSite, type SearchResultBundle } from '../lib/stage-connect';
import { normalizeSearchQuery, SEARCH_QUERY_LIMIT } from '../lib/search-query';
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName } from '../lib/en-copy';

export async function SiteSearchPage({ locale, query }: { locale: 'ja' | 'en'; query: string }) {
  const en = locale === 'en';
  const prefix = en ? '/en' : '';
  const q = normalizeSearchQuery(query);
  let results: SearchResultBundle = { actors: [], plays: [], series: [] };
  let unavailable = false;
  if (q) {
    try { results = await searchSite(q, 20); } catch { unavailable = true; }
  }
  const groups = [
    { kind: 'actors', label: en ? 'Actors' : '俳優', rows: results.actors.map(item => ({ slug: item.slug, title: en ? getEnglishActorName(item) : item.name, sub: en ? null : item.kana })) },
    { kind: 'plays', label: en ? 'Plays' : '作品', rows: results.plays.map(item => ({ slug: item.slug, title: en ? getEnglishPlayTitle(item) : item.title, sub: en ? item.franchiseNameEn : item.franchiseName })) },
    { kind: 'series', label: en ? 'Series' : 'シリーズ', rows: results.series.map(item => ({ slug: item.slug, title: en ? getEnglishSeriesName(item) : item.name, sub: null })) },
  ];
  const count = groups.reduce((sum, group) => sum + group.rows.length, 0);
  return <main className="container stack-lg editorial-directory directory--search">
    <section className="hero-card stack-md directory-search-hero">
      <span className="directory-hero__word" aria-hidden="true">SEARCH</span>
      <h1 className="page-title">{en ? 'Search' : '検索'}</h1>
      <p className="lead">{en ? 'Explore actors, productions and series.' : '俳優・作品・シリーズを横断して探せます。'}</p>
      <DirectorySearchForm className="v2-search" action={`${prefix}/search`}>
        <label className="sr-only" htmlFor="site-query">{en ? 'Search actors, plays and series' : '俳優・作品・シリーズを検索'}</label>
        <input id="site-query" name="q" defaultValue={q} maxLength={SEARCH_QUERY_LIMIT} placeholder={en ? 'Search actors, plays and series' : '俳優・作品・シリーズ名を入力'}/>
        <button type="submit" aria-label={en ? 'Search' : '検索'}>→</button>
      </DirectorySearchForm>
    </section>
    {!q ? <p className="muted">{en ? 'Enter a name or title to start exploring.' : '名前や作品名を入力して検索できます。'}</p>
      : unavailable ? <p role="status" className="muted">{en ? 'Search is temporarily unavailable. Please try again later.' : '検索を読み込めませんでした。時間をおいてお試しください。'}</p>
      : <p className="muted">{en ? `Showing ${count} results for “${q}”` : `「${q}」の検索結果：${count}件を表示`}{count === 0 ? (en ? '. Try another keyword.' : '。表記を変えてお試しください。') : ''}</p>}
    {count > 0 ? <nav className="directory-search-types" aria-label={en ? 'Result categories' : '検索結果の種類'}>
      {groups.filter(group => group.rows.length).map(group => <a key={group.kind} href={`#results-${group.kind}`}>{group.label}<span>{group.rows.length}</span></a>)}
    </nav> : <nav className="directory-search-exits" aria-label={en ? 'Explore the archive' : '一覧から探す'}>
      {groups.map(group => <Link key={group.kind} href={`${prefix}/${group.kind}`}>{group.label}<span aria-hidden="true">→</span></Link>)}
    </nav>}
    {groups.filter(group => group.rows.length).map(group => <section id={`results-${group.kind}`} key={group.kind} className={`section-card stack-md search-results-group search-results-group--${group.kind}`}>
      <div className="section-header-inline"><h2 className="section-title">{group.label}</h2>
        <Link className="section-link" href={`${prefix}/${group.kind}?q=${encodeURIComponent(q)}`}>{en ? 'Browse matches →' : '一覧で探す →'}</Link>
      </div>
      <div className="results-grid">{group.rows.map(item => <Link className="list-card search-result" key={item.slug} href={`${prefix}/${group.kind}/${item.slug}`}>
        <span className="cast-name">{item.title}</span>{item.sub ? <span className="muted">{item.sub}</span> : null}
      </Link>)}</div>
    </section>)}
  </main>;
}
