import type { Metadata } from "next";
import Link from "next/link";
import { getSeriesList, toPlainText, truncate } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "シリーズ一覧 - Stage Connect",
  description:
    "2.5次元舞台・ミュージカルのシリーズやフランチャイズを一覧で整理。配下作品や出演キャストへ繋がるシリーズページの入口です。",
};

export default async function SeriesPage() {
  const seriesList = await getSeriesList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Series</span>
            <h1 className="page-title">シリーズ一覧</h1>
            <p className="lead">
              テニミュの各シーズンや、刀ステ・刀ミュのようなシリーズ単位で作品群を整理しています。
              シリーズページから作品年表、出演キャスト、役柄一覧まで横断できる構成です。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">掲載シリーズ {seriesList.length}件</span>
            <span className="catalog-chip">作品群をまとめて確認</span>
            <span className="catalog-chip">キャスト導線のハブ</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">シリーズ・フランチャイズ</h2>
            <p className="catalog-note">
              長期シリーズや派生展開の多い作品群を、一覧からそのまま追いやすいように整理しています。
            </p>
          </div>

          <div className="catalog-grid">
            {seriesList.map((series) => (
              <article className="catalog-card" key={series.slug}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={`/series/${series.slug}`}>
                    {series.name}
                  </Link>
                  <span className="catalog-card__badge">{series.playCount}作品</span>
                </div>

                {series.description ? (
                  <div className="catalog-card__text">{truncate(toPlainText(series.description), 140)}</div>
                ) : (
                  <div className="catalog-card__text">シリーズ情報は順次整備中です。</div>
                )}

                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={`/series/${series.slug}`}>
                    シリーズ詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
