import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "dアニメストアと2.5次元舞台 - Stage Connect",
  description:
    "dアニメストアと2.5次元舞台・ミュージカルの相性を整理した比較ガイドです。アニメ寄りのサービスとしての特徴と、DMM TVとの違いをまとめています。",
};

export default function WatchDanimePage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Compare</span>
            <h1 className="page-title">dアニメストアと2.5次元舞台</h1>
            <p className="lead">
              dアニメストアはアニメ視聴に強いサービスです。2.5次元舞台の配信も一部ありますが、
              作品数を重視するならDMM TVを軸に考えるのが分かりやすいです。
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
          <h2 className="section-title">dアニメストアの立ち位置</h2>
          <div className="prose-panel">
            {`dアニメストアは、アニメを中心に楽しみたい人に向いた配信サービスです。
2.5次元舞台をまとめて追いかける用途では、掲載本数やシリーズの探しやすさの面でDMM TVのほうが優位になりやすいです。
そのため、舞台配信を主目的にするならDMM TVを先に確認し、dアニメストアはアニメ中心の視聴環境として併用を考えるのが自然です。`}
          </div>
        </section>
      </div>
    </main>
  );
}
