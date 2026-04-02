import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "DMM TVで見られる2.5次元舞台・ミュージカル - Stage Connect",
  description:
    "DMM TVで見られる2.5次元舞台・ミュージカルのシリーズ一覧です。DMMプレミアムの料金や、シリーズページへの導線をまとめています。",
};

export default async function WatchDmmPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">DMM TV</span>
            <h1 className="page-title">DMM TVで見られるシリーズ</h1>
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
          <div className="catalog-summary">
            <span className="catalog-chip">月額 550円</span>
            <span className="catalog-chip">14日間無料トライアル</span>
            <span className="catalog-chip">掲載シリーズ {overview.dmmSeriesCount.toLocaleString()}件</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">DMM TVを使う理由</h2>
            <p className="catalog-note">
              2.5次元舞台の配信本数を重視するなら、まずDMM TVを起点に見るのが分かりやすいです。
            </p>
          </div>

          <div className="prose-panel">
            {`DMM TVは、2.5次元舞台・ミュージカルを見たい人にとって最初に確認しやすい配信サービスです。
シリーズ単位で追いかけやすく、作品ページからそのまま配信導線へ移動できるのが強みです。
まずは見たいシリーズを確認して、シリーズページ・作品ページへ移動しながら視聴可否を把握していく使い方がおすすめです。`}
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
                  DMM TVで追いやすいシリーズです。シリーズページから作品数や出演キャストも確認できます。
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
