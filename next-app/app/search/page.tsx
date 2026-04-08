import type { Metadata } from "next";
import Link from "next/link";
import { searchSite } from "../../lib/stage-connect";

type SearchParams = {
  q?: string;
};

export const metadata: Metadata = {
  title: "検索 | Stage Connect（ステコネ）",
  description: "俳優、作品、シリーズを横断して検索できます。",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim();
  const results = q ? await searchSite(q, 20) : { actors: [], plays: [], series: [] };
  const total = results.actors.length + results.plays.length + results.series.length;

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-sm">
          <span className="eyebrow">Search</span>
          <h1 className="page-title">検索</h1>
          <p className="muted">キャスト、作品、シリーズを横断して探せます。</p>
        </section>

        {!q ? (
          <section className="section-card">
            <p className="muted">上部の検索バーからキーワードを入力してください。</p>
          </section>
        ) : (
          <>
            <section className="section-card stack-sm">
              <div className="section-header-inline">
                <h2 className="section-title">検索結果</h2>
                <span className="pill">{total}</span>
              </div>
              <p className="muted">
                キーワード: <strong>{q}</strong>
              </p>
            </section>

            {results.actors.length > 0 ? (
              <section className="section-card stack-md">
                <h2 className="section-title">俳優</h2>
                <div className="results-grid">
                  {results.actors.map((actor) => (
                    <article key={actor.id} className="list-card">
                      <Link href={`/actors/${actor.slug}`} className="cast-name">
                        {actor.name}
                      </Link>
                      {actor.kana ? <div className="muted">{actor.kana}</div> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {results.plays.length > 0 ? (
              <section className="section-card stack-md">
                <h2 className="section-title">作品</h2>
                <div className="results-grid">
                  {results.plays.map((play) => (
                    <article key={play.id} className="list-card">
                      <Link href={`/plays/${play.slug}`} className="cast-name">
                        {play.title}
                      </Link>
                      {play.franchiseName ? (
                        <div className="muted">
                          {play.franchiseSlug ? (
                            <Link href={`/series/${play.franchiseSlug}`}>{play.franchiseName}</Link>
                          ) : (
                            play.franchiseName
                          )}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {results.series.length > 0 ? (
              <section className="section-card stack-md">
                <h2 className="section-title">シリーズ</h2>
                <div className="results-grid">
                  {results.series.map((series) => (
                    <article key={series.id} className="list-card">
                      <Link href={`/series/${series.slug}`} className="cast-name">
                        {series.name}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {total === 0 ? (
              <section className="section-card">
                <p className="muted">検索結果が見つかりませんでした。</p>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
