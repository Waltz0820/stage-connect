import type { Metadata } from "next";
import Link from "next/link";
import { StructuredData } from "../../components/StructuredData";
import { buildCollectionPageStructuredData } from "../../lib/structured-data";
import { getGuideList, toPlainText, truncate } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const revalidate = 3600;

const CATEGORY_LABELS: Record<string, string> = {
  "series-guides": "シリーズガイド",
  features: "編集部ピックアップ",
};

export const metadata: Metadata = {
  title: "編集部ガイド | Stage Connect（ステコネ）",
  description:
    "シリーズの見どころや配信の選び方をまとめた、2.5次元舞台・ミュージカルの編集部ガイド一覧です。",
  alternates: {
    canonical: `${siteUrl}/guide`,
  },
};

export default async function GuidePage() {
  const guides = await getGuideList();
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "編集部ガイド",
    description:
      "シリーズの見どころや作品理解に役立つ編集部ガイドをまとめたページです。",
    path: "/guide",
  });

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Guide</span>
            <h1 className="page-title">編集部ガイド</h1>
            <p className="lead">
              2.5次元舞台・ミュージカルの見どころや作品理解に役立つ編集部ガイドを一覧できます。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">公開ガイド {guides.length}本</span>
            <span className="catalog-chip">シリーズ理解を補強</span>
            <span className="catalog-chip">作品ページとあわせて読める</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">ガイド一覧</h2>
            <p className="catalog-note">
              気になるシリーズの見どころや、作品ごとの理解を深めるガイドをまとめています。
            </p>
          </div>

          <div className="catalog-grid">
            {guides.map((guide) => (
              <article className="catalog-card" key={guide.slug}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={`/guide/${guide.slug}`}>
                    {guide.title}
                  </Link>
                  {guide.category ? (
                    <span className="catalog-card__badge">
                      {CATEGORY_LABELS[guide.category] ?? guide.category}
                    </span>
                  ) : null}
                </div>

                {guide.publishedAt ? (
                  <div className="catalog-card__sub">
                    {new Date(guide.publishedAt).toLocaleDateString("ja-JP")}
                  </div>
                ) : null}

                <div className="catalog-card__text">
                  {truncate(toPlainText(guide.summary || guide.content || guide.title), 160)}
                </div>

                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={`/guide/${guide.slug}`}>
                    ガイドを読む
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
