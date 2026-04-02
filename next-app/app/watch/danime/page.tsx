import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "dアニメストア と 2.5次元舞台 - Stage Connect",
  description:
    "dアニメストア と 2.5次元舞台・ミュージカルの相性を整理した比較ページ。DMM TV と見比べながら、用途の違いを把握できます。",
};

export default function WatchDanimePage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Compare</span>
            <h1 className="page-title">dアニメストア と 2.5次元舞台</h1>
            <p className="lead">
              dアニメストアはアニメ視聴には強いサービスですが、2.5次元舞台の主導線としては DMM TV を軸に見る方が整理しやすいです。
              ここでは比較用の補助情報として位置づけています。
            </p>
          </div>

          <div className="action-row">
            <Link className="action-button" href="/watch/dmm">
              DMM TV の一覧を見る
            </Link>
            <Link className="action-button" href="/watch">
              視聴ガイドTOPへ
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">位置づけ</h2>
          <div className="prose-panel">
            {`dアニメストアは、アニメに寄った視聴体験では強いサービスです。

ただし 2.5次元舞台・ミュージカルの配信導線としては、シリーズ整理や作品接続の面で DMM TV を先に確認する方が自然です。

このページでは、比較対象としての立ち位置だけをシンプルに整理しています。`}
          </div>
        </section>
      </div>
    </main>
  );
}
