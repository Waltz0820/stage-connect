import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "U-NEXT と 2.5次元作品 - Stage Connect",
  description:
    "U-NEXT と 2.5次元作品の相性を整理する比較ページです。主軸は DMM TV に置きつつ、比較導線を初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default function WatchUNextPage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Watch Compare SSR</span>
            <h1 className="page-title">U-NEXT と 2.5次元作品</h1>
            <p className="lead">
              U-NEXT は幅広い映像作品を扱うサービスですが、2.5次元作品の視聴導線としては DMM TV
              を主軸にした方が整理しやすい、という前提で比較しています。
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
            U-NEXT は総合型サービスとして魅力がありますが、2.5次元作品だけを素早く探す導線としては DMM TV
            の方が整理しやすい想定です。このページは比較用の補助導線として置いています。
          </div>
        </section>
      </div>
    </main>
  );
}
