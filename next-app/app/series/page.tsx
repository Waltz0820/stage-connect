import type { Metadata } from "next";
import Link from "next/link";
import { getSeriesList, toPlainText, truncate } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "シリーズ一覧 - Stage Connect",
  description:
    "Stage Connect のシリーズ一覧ページです。シリーズ詳細ページへの内部リンクを初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default async function SeriesPage() {
  const seriesList = await getSeriesList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Series SSR</span>
            <h1 className="page-title">シリーズ一覧</h1>
            <p className="lead">
              シリーズ一覧から詳細ページへの内部リンクを、初期HTMLに含めて出力する Next.js
              プロトタイプです。現在の掲載シリーズ数は {seriesList.length} 件です。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="cast-list">
            {seriesList.map((series) => (
              <article className="cast-card" key={series.slug}>
                <Link className="cast-name" href={`/series/${series.slug}`}>
                  {series.name}
                </Link>
                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  {series.playCount}作品
                </div>
                {series.description ? (
                  <div className="cast-role">{truncate(toPlainText(series.description), 160)}</div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
