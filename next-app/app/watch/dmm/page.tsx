import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../../lib/stage-connect";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const metadata: Metadata = {
  title: "DMM TV で観られる 2.5次元作品 - Stage Connect",
  description:
    "DMM TV で視聴できる 2.5次元作品・ミュージカルのシリーズ一覧です。シリーズ詳細への内部リンクも初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default async function WatchDmmPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">DMM Watch SSR</span>
            <h1 className="page-title">DMM TV で観られるシリーズ</h1>
            <p className="lead">
              DMM TV で視聴できる 2.5次元作品のシリーズ一覧です。現在 {overview.dmmSeriesCount.toLocaleString()}{" "}
              シリーズを確認しています。
            </p>
          </div>
          <div className="pill-row">
            <a className="inline-link" href={DMM_PREMIUM_URL} target="_blank" rel="sponsored noopener noreferrer">
              DMM プレミアムへ
            </a>
            <Link className="inline-link" href="/watch">
              視聴ガイドトップへ
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">シリーズ一覧</h2>
          <div className="cast-list">
            {overview.dmmTopFranchises.map((series) => (
              <article className="cast-card" key={series.id}>
                <Link className="cast-name" href={series.slug ? `/series/${series.slug}` : "/series"}>
                  {series.name}
                </Link>
                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  {series.playCount}作品
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
