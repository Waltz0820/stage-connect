import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "dアニメストア と 2.5次元作品 - Stage Connect",
  description:
    "dアニメストア と 2.5次元作品の相性を整理する比較ページです。比較導線を初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default function WatchDanimePage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Watch Compare SSR</span>
            <h1 className="page-title">dアニメストア と 2.5次元作品</h1>
            <p className="lead">
              dアニメストア はアニメ視聴には強い一方で、2.5次元作品の主導線としては DMM TV を軸にした方が比較しやすい、
              という前提で整理しています。
            </p>
          </div>
          <div className="pill-row">
            <span className="pill">比較ページ</span>
            <Link className="inline-link" href="/watch/dmm">
              DMM TV の視聴一覧を見る
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">位置づけ</h2>
          <div className="cast-role">
            アニメ寄りの視聴導線として比較対象に置きつつ、2.5次元作品を探す主導線は DMM TV
            に寄せる方針です。このページは比較検討の補助として使います。
          </div>
        </section>
      </div>
    </main>
  );
}
