import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "DMM TVで見られる2.5次元舞台・ミュージカル - Stage Connect",
  description:
    "DMM TVで見られる2.5次元舞台・ミュージカルのシリーズ一覧です。DMMプレミアムの料金や、シリーズページへの導線をまとめています。",
};

metadata.alternates = {
  canonical: `${siteUrl}/watch/dmm`,
};

export default async function WatchDmmPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">DMM Premium × Stage Connect</span>
            <h1 className="page-title">2.5次元舞台をDMM TVで観る</h1>
            <p className="lead">
              DMM TVで視聴できる2.5次元舞台・ミュージカルを、シリーズ単位で整理しています。
              Stage Connectでは現在 {overview.dmmSeriesCount.toLocaleString()} シリーズを確認できます。
            </p>
          </div>

          <div className="action-row">
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              DMMプレミアムを見る
            </a>
            <Link className="action-button" href="/watch">
              配信ガイドへ戻る
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="watch-stat-grid">
            <div className="watch-stat-card">
              <div className="watch-stat-label">月額</div>
              <div className="watch-stat-value">550円</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">無料トライアル</div>
              <div className="watch-stat-value">14日間</div>
            </div>
            <div className="watch-stat-card">
              <div className="watch-stat-label">配信シリーズ</div>
              <div className="watch-stat-value">{overview.dmmSeriesCount.toLocaleString()}件</div>
            </div>
          </div>
        </section>

        <section className="grid grid-2">
          <section className="section-card stack-md">
            <h2 className="section-title">なぜDMM TVが2.5次元に強いのか</h2>
            <div className="prose-panel">
              {`2.5次元舞台・ミュージカルを見放題で観たいなら、現状もっとも有力なのがDMM TVです。
刀剣乱舞、ヒプステ、テニミュ、あんステなど、主要シリーズの多くが配信対象に含まれています。
他のサービスではレンタル中心になる作品も、DMMプレミアムでは見放題に入っているケースが多く、2.5次元ファンがまず確認すべき配信先になっています。`}
            </div>

            <div className="catalog-summary">
              <span className="catalog-chip">2.5次元 見放題が充実</span>
              <span className="catalog-chip">シリーズ単位で確認しやすい</span>
              <span className="catalog-chip">作品詳細からそのまま遷移</span>
            </div>
          </section>

          <section className="section-card stack-md">
            <h2 className="section-title">次の動き方</h2>
            <div className="compare-grid">
              <article className="compare-card">
                <div className="compare-card__eyebrow">Step 01</div>
                <div className="compare-card__title">シリーズから入る</div>
                <div className="compare-card__text">見たいシリーズを選び、年表と作品一覧から履修順を把握します。</div>
              </article>
              <article className="compare-card">
                <div className="compare-card__eyebrow">Step 02</div>
                <div className="compare-card__title">作品詳細で深掘る</div>
                <div className="compare-card__text">キャストや公演情報を確認しながら、視聴リンクへつなげます。</div>
              </article>
            </div>
          </section>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">シリーズ一覧</h2>
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
                  DMM TVで配信導線をたどれるシリーズです。シリーズ詳細から作品一覧や出演キャストも確認できます。
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
