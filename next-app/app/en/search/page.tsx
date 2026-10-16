import type { Metadata } from 'next';
import Link from 'next/link';
import { searchSite } from '../../../lib/stage-connect';
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName } from '../../../lib/en-copy';

export const metadata: Metadata = { title: 'Search | Stage Connect', description: 'Search actors, productions and series.', robots: { index: false, follow: true } };
export default async function EnglishSearch({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const q = String((await searchParams)?.q ?? '').trim().slice(0,200);
  const results = q ? await searchSite(q,20) : { actors: [], plays: [], series: [] };
  const count = results.actors.length + results.plays.length + results.series.length;
  return <main className="container stack-lg" style={{ paddingBlock: 32 }}>
    <section className="hero-card stack-md"><h1 className="page-title">Search</h1><p className="lead">Explore actors, productions and series.</p>
      <form className="v2-search" action="/en/search"><label className="sr-only" htmlFor="search-query">Search</label><input id="search-query" name="q" defaultValue={q} placeholder="Search actors, plays and series"/><button type="submit" aria-label="Search">→</button></form>
    </section>
    {q ? <p className="muted">Results for “{q}”: {count}{count === 0 ? '. Try another keyword.' : ''}</p> : null}
    {results.actors.length ? <section className="section-card stack-md"><h2 className="section-title">Actors</h2><div className="results-grid">{results.actors.map(actor => <Link className="list-card" key={actor.id} href={`/en/actors/${actor.slug}`}>{getEnglishActorName(actor)}</Link>)}</div></section> : null}
    {results.plays.length ? <section className="section-card stack-md"><h2 className="section-title">Plays</h2><div className="results-grid">{results.plays.map(play => <Link className="list-card" key={play.id} href={`/en/plays/${play.slug}`}>{getEnglishPlayTitle(play)}</Link>)}</div></section> : null}
    {results.series.length ? <section className="section-card stack-md"><h2 className="section-title">Series</h2><div className="results-grid">{results.series.map(series => <Link className="list-card" key={series.id} href={`/en/series/${series.slug}`}>{getEnglishSeriesName(series)}</Link>)}</div></section> : null}
  </main>;
}
