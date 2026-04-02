import type { Metadata } from "next";
import Link from "next/link";
import { getGuideList, toPlainText, truncate } from "../../lib/stage-connect";

const CATEGORY_LABELS: Record<string, string> = {
  "series-guides": "シリーズガイド",
  features: "編集部ピックアップ",
};

export const metadata: Metadata = {
  title: "編集部ガイド - Stage Connect",
  description:
    "Stage Connect の編集部ガイド一覧です。ガイド詳細ページへの内部リンクを初期HTMLで出力する Next.js プロトタイプとして構成しています。",
};

export default async function GuidePage() {
  const guides = await getGuideList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Guide SSR</span>
            <h1 className="page-title">編集部ガイド</h1>
            <p className="lead">
              シリーズ整理や作品ピックアップを、初期HTMLに含めて出力する Next.js
              プロトタイプです。現在の掲載ガイド数は {guides.length} 本です。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="cast-list">
            {guides.map((guide) => (
              <article className="cast-card" key={guide.slug}>
                {guide.category ? (
                  <div className="muted mono" style={{ fontSize: 12 }}>
                    {CATEGORY_LABELS[guide.category] ?? guide.category}
                  </div>
                ) : null}
                <Link className="cast-name" href={`/guide/${guide.slug}`}>
                  {guide.title}
                </Link>
                {guide.publishedAt ? (
                  <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                    {new Date(guide.publishedAt).toLocaleDateString("ja-JP")}
                  </div>
                ) : null}
                <div className="cast-role">
                  {truncate(toPlainText(guide.summary || guide.content || guide.title), 180)}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
