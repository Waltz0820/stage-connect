import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "U-NEXTと2.5次元舞台 - Stage Connect",
  description:
    "U-NEXTと2.5次元舞台・ミュージカルの相性を整理した比較ガイドです。DMM TVとの違いや、どんな人に向いているかをまとめています。",
};

export default function WatchUNextPage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Compare</span>
            <h1 className="page-title">U-NEXTと2.5次元舞台</h1>
            <p className="lead">
              U-NEXTは映画・アニメ・ドラマに強い一方で、2.5次元舞台の配信本数ではDMM TVが優位です。
              ここでは、比較の起点としてU-NEXTの位置づけを整理しています。
            </p>
          </div>

          <div className="action-row">
            <Link className="action-button" href="/watch/dmm">
              DMM TVとの違いを見る
            </Link>
            <Link className="action-button" href="/watch">
              配信ガイドへ戻る
            </Link>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">U-NEXTの立ち位置</h2>
          <div className="prose-panel">
            {`U-NEXTは、映画・アニメ・ドラマを広く楽しみたい人に向いた配信サービスです。
一方で、2.5次元舞台・ミュージカルをシリーズ単位で追いかける用途では、DMM TVのほうが探しやすいケースが多くなります。
そのため、2.5次元舞台を主目的にするならDMM TVを優先しつつ、U-NEXTは映像配信全体を広く使いたい人向けの選択肢として考えるのが自然です。`}
          </div>
        </section>
      </div>
    </main>
  );
}
