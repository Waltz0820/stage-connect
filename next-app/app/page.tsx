import type { Metadata } from "next";
import Link from "next/link";
import {
  getActorList,
  getGuideList,
  getPlayList,
  getSeriesList,
  getWatchOverview,
  toPlainText,
  truncate,
} from "../lib/stage-connect";

export const metadata: Metadata = {
  title: "Stage Connect | 2.5次元舞台・ミュージカルのキャスト・作品アーカイブ",
  description:
    "2.5次元舞台・ミュージカルの作品とキャストをつなぐデジタルアーカイブ。出演者・配信（VOD）・公演情報・シリーズ情報をまとめて確認できます。",
};

export default async function HomePage() {
  const [plays, actors, seriesList, guides, watchOverview] = await Promise.all([
    getPlayList(),
    getActorList(),
    getSeriesList(),
    getGuideList(),
    getWatchOverview(),
  ]);

  const featuredPlays = plays.slice(0, 6);
  const featuredActors = actors.slice(0, 6);
  const featuredSeries = seriesList.slice(0, 6);
  const featuredGuides = guides.slice(0, 4);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-lg">
          <div>
            <span className="eyebrow">Digital Archive</span>
            <h1 className="page-title">Stage Connect | 2.5次元舞台・ミュージカルの情報アーカイブ</h1>
            <p className="lead">
              2.5次元舞台・ミュージカルの作品とキャストをつなぐデジタルアーカイブです。
              作品・俳優・シリーズ・配信ガイドを横断しながら、見たい情報へ最短でたどり着ける構造を目指しています。
            </p>
          </div>

          <div className="pill-row">
            <span className="pill">作品 {plays.length}件</span>
            <span className="pill">俳優 {actors.length}人</span>
            <span className="pill">シリーズ {seriesList.length}件</span>
            <span className="pill">ガイド {guides.length}本</span>
            <span className="pill">DMM掲載シリーズ {watchOverview.dmmSeriesCount}件</span>
          </div>

          <div className="inline-links">
            <Link className="inline-link" href="/plays">
              作品一覧
            </Link>
            <Link className="inline-link" href="/actors">
              俳優一覧
            </Link>
            <Link className="inline-link" href="/series">
              シリーズ一覧
            </Link>
            <Link className="inline-link" href="/guide">
              編集部ガイド
            </Link>
            <Link className="inline-link" href="/watch">
              見る方法を探す
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              新着作品
            </h2>
            <Link className="inline-link" href="/plays">
              作品一覧を見る
            </Link>
          </div>
          <div className="cast-list">
            {featuredPlays.map((play) => (
              <article className="cast-card" key={play.slug}>
                <Link className="cast-name" href={`/plays/${play.slug}`}>
                  {play.title}
                </Link>
                {play.franchiseName ? <div className="muted" style={{ marginTop: 4 }}>{play.franchiseName}</div> : null}
                {play.period ? <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>{play.period}</div> : null}
                {play.summary ? <div className="cast-role">{truncate(toPlainText(play.summary), 120)}</div> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section-card stack-md">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              注目シリーズ
            </h2>
            <Link className="inline-link" href="/series">
              シリーズ一覧を見る
            </Link>
          </div>
          <div className="cast-list">
            {featuredSeries.map((series) => (
              <article className="cast-card" key={series.slug}>
                <Link className="cast-name" href={`/series/${series.slug}`}>
                  {series.name}
                </Link>
                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>{series.playCount}作品</div>
                {series.description ? <div className="cast-role">{truncate(toPlainText(series.description), 120)}</div> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-2">
          <section className="section-card stack-md">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                俳優
              </h2>
              <Link className="inline-link" href="/actors">
                俳優一覧を見る
              </Link>
            </div>
            <div className="cast-list">
              {featuredActors.map((actor) => (
                <article className="cast-card" key={actor.slug}>
                  <Link className="cast-name" href={`/actors/${actor.slug}`}>
                    {actor.name}
                  </Link>
                  {actor.kana ? <div className="muted" style={{ marginTop: 4 }}>{actor.kana}</div> : null}
                  {actor.profile ? <div className="cast-role">{truncate(toPlainText(actor.profile), 100)}</div> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="section-card stack-md">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                編集部ガイド
              </h2>
              <Link className="inline-link" href="/guide">
                ガイド一覧を見る
              </Link>
            </div>
            <div className="cast-list">
              {featuredGuides.map((guide) => (
                <article className="cast-card" key={guide.slug}>
                  <Link className="cast-name" href={`/guide/${guide.slug}`}>
                    {guide.title}
                  </Link>
                  <div className="cast-role">{truncate(toPlainText(guide.summary || guide.content || guide.title), 120)}</div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="section-card stack-md">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              配信ガイド
            </h2>
            <Link className="inline-link" href="/watch">
              配信ガイドを見る
            </Link>
          </div>
          <div className="cast-list">
            <article className="cast-card">
              <Link className="cast-name" href="/watch/dmm">
                DMM TV で見られるシリーズ一覧
              </Link>
              <div className="cast-role">
                現在 {watchOverview.dmmSeriesCount.toLocaleString()} シリーズを掲載しています。視聴の主軸として使いやすい配信先です。
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
