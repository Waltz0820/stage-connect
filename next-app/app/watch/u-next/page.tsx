import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "U-NEXT と 2.5次元舞台 - Stage Connect",
  description:
    "U-NEXT と 2.5次元舞台・ミュージカルの相性を整理した比較ページ。DMM TV を軸に比較しながら、視聴サービス選びの判断材料をまとめています。",
};

export default function WatchUNextPage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Compare</span>
            <h1 className="page-title">U-NEXT と 2.5次元舞台</h1>
            <p className="lead">
              U-NEXT は映画やアニメには強い一方で、2.5次元舞台の視聴導線としては DMM TV を主軸に見る方が自然です。
              ここでは比較用の判断材料として、役割の違いだけを整理しています。
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
            {`U-NEXT は映画・アニメ・ドラマの総合力が高いサービスです。

一方で 2.5次元舞台・ミュージカルを追う文脈では、シリーズのまとまり方や導線の作りやすさの点で DMM TV を先に確認する方が自然です。

このページは、比較対象として U-NEXT の立ち位置を把握するための補助ページとして設計しています。`}
          </div>
        </section>
      </div>
    </main>
  );
}
