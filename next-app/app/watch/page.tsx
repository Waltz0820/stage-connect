import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "視聴ガイド - Stage Connect",
  description:
    "2.5次元舞台・ミュージカルをどこで見られるかを整理した視聴ガイド。DMM TV を軸に、U-NEXT・dアニメとの比較導線も用意しています。",
};

export default async function WatchPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Watch</span>
            <h1 className="page-title">視聴ガイド</h1>
            <p className="lead">
              2.5次元舞台・ミュージカルを、どの配信サービスで見られるかを整理しています。DMM TV を主軸に、
              U-NEXT・dアニメストアとの比較や、シリーズ単位の視聴導線へ繋げるためのハブページです。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">DMM掲載シリーズ {overview.dmmSeriesCount.toLocaleString()}件</span>
            <span className="catalog-chip">比較導線あり</span>
            <span className="catalog-chip">シリーズページへ接続</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">主要サービス</h2>
            <p className="catalog-note">まずは DMM TV を軸に、比較用の導線をまとめています。</p>
          </div>

          <div className="compare-grid">
            <article className="compare-card">
              <div className="compare-card__eyebrow">Recommended</div>
              <Link className="compare-card__title" href="/watch/dmm">
                DMM TV で見られるシリーズ一覧
              </Link>
              <div className="compare-card__text">
                2.5次元舞台との相性が強い DMM TV を主軸に、シリーズ一覧と導線をまとめています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/u-next">
                U-NEXT との比較を見る
              </Link>
              <div className="compare-card__text">
                U-NEXT の強みと、2.5次元作品を見る上での立ち位置を整理しています。
              </div>
            </article>

            <article className="compare-card">
              <div className="compare-card__eyebrow">Compare</div>
              <Link className="compare-card__title" href="/watch/danime">
                dアニメとの比較を見る
              </Link>
              <div className="compare-card__text">
                アニメ寄りのサービスとの違いを整理しながら、舞台視聴の向き不向きを確認できます。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">DMM TV で見られる主なシリーズ</h2>
          <div className="catalog-grid">
            {overview.dmmTopFranchises.map((series) => (
              <article className="catalog-card" key={series.id}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={series.slug ? `/series/${series.slug}` : "/series"}>
                    {series.name}
                  </Link>
                  <span className="catalog-card__badge">{series.playCount}作品</span>
                </div>

                <div className="catalog-card__text">
                  DMM TV から視聴導線を辿れるシリーズです。シリーズページから作品一覧や出演キャストも確認できます。
                </div>

                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={series.slug ? `/series/${series.slug}` : "/series"}>
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
