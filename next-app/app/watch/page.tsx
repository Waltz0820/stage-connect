import type { Metadata } from "next";
import Link from "next/link";
import { getWatchOverview } from "../../lib/stage-connect";

export const metadata: Metadata = {
  title: "視聴ガイド - Stage Connect",
  description:
    "2.5次元作品をどこで観るかを整理する Stage Connect の視聴ガイドです。主要導線を初期HTMLに含めて出力する Next.js プロトタイプとして構成しています。",
};

export default async function WatchPage() {
  const overview = await getWatchOverview();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Watch SSR</span>
            <h1 className="page-title">視聴ガイド</h1>
            <p className="lead">
              視聴導線も初期HTMLに含めて出力する Next.js プロトタイプです。DMM TV
              で確認できるシリーズは {overview.dmmSeriesCount.toLocaleString()} 件です。
            </p>
          </div>
          <div className="pill-row">
            <span className="pill">主軸: DMM TV</span>
            <span className="pill">比較: U-NEXT / dアニメストア</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">主な導線</h2>
          <div className="cast-list">
            <article className="cast-card">
              <Link className="cast-name" href="/watch/dmm">
                DMM TV で観られるシリーズ一覧
              </Link>
              <div className="cast-role">
                2.5次元作品と相性の良い DMM TV を主軸に、視聴導線をまとめたページです。
              </div>
            </article>
            <article className="cast-card">
              <Link className="cast-name" href="/watch/u-next">
                U-NEXT との比較を見る
              </Link>
              <div className="cast-role">
                視聴のしやすさと 2.5次元作品との相性を比較し、DMM TV を選びやすくする導線です。
              </div>
            </article>
            <article className="cast-card">
              <Link className="cast-name" href="/watch/danime">
                dアニメストア との比較を見る
              </Link>
              <div className="cast-role">
                アニメ視聴に強いサービスとの違いを整理して、比較検討しやすくしています。
              </div>
            </article>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">DMM TV で観られる主なシリーズ</h2>
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
