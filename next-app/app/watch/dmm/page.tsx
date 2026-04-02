import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "DMM TVで見られる2.5次元舞台 - Stage Connect",
  description:
    "DMM TV で見られる 2.5次元舞台・ミュージカルのシリーズ一覧。DMM プレミアム導線と、シリーズページへの接続をまとめています。",
};

export default async function WatchDmmPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">DMM TV</span>
            <h1 className="page-title">DMM TV で見られるシリーズ</h1>
            <p className="lead">
              DMM TV で視聴できる 2.5次元舞台・ミュージカルを、シリーズ単位で整理しています。
              Stage Connect では現在 {overview.dmmSeriesCount.toLocaleString()} シリーズ分の導線を掲載しています。
            </p>
          </div>

          <div className="action-row">
            <a
              className="action-button action-button-primary"
              href={DMM_PREMIUM_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              DMMプレミアムへ
            </a>
            <Link className="action-button" href="/watch">
              視聴ガイドTOPへ
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="catalog-summary">
            <span className="catalog-chip">月額 550円</span>
            <span className="catalog-chip">14日間無料トライアル</span>
            <span className="catalog-chip">掲載シリーズ {overview.dmmSeriesCount.toLocaleString()}件</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">DMM TV を使う理由</h2>
            <p className="catalog-note">
              2.5次元舞台の配信本数が多く、シリーズ単位で視聴導線をまとめやすいのが強みです。
            </p>
          </div>

          <div className="prose-panel">
            {`DMM TV は、2.5次元舞台・ミュージカルを追ううえで最初に見ておきたい配信サービスです。

特定シリーズのまとまり方や、再演・ライブ・スピンオフへの接続が強く、Stage Connect でも主軸の視聴導線として扱っています。

まずはシリーズ一覧から見たい作品群を確認して、各シリーズページ・作品ページへ移動する使い方が自然です。`}
          </div>
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
                  DMM TV から視聴しやすいシリーズです。シリーズページでは作品年表や出演キャストも確認できます。
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
