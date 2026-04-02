import type { Metadata } from "next";
import Link from "next/link";
import { getGuideList, toPlainText, truncate } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const CATEGORY_LABELS: Record<string, string> = {
  "series-guides": "シリーズガイド",
  features: "編集部ピックアップ",
};

export const metadata: Metadata = {
  title: "編集部ガイド | Stage Connect",
  description:
    "シリーズ整理や作品ピックアップをまとめた Stage Connect の編集部ガイド一覧。DBだけでは整理しきれない文脈も、読み物として確認できます。",
};

metadata.alternates = {
  canonical: `${siteUrl}/guide`,
};

export default async function GuidePage() {
  const guides = await getGuideList();

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Guide</span>
            <h1 className="page-title">編集部ガイド</h1>
            <p className="lead">
              シリーズ整理や作品ピックアップを、Stage Connect の編集部目線でまとめた読み物です。
              DBページとあわせて読むことで、シリーズ全体の流れや見どころをつかみやすくするための補助線として用意しています。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">公開ガイド {guides.length}本</span>
            <span className="catalog-chip">シリーズ整理を補強</span>
            <span className="catalog-chip">作品文脈を深掘り</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">ガイド一覧</h2>
            <p className="catalog-note">
              気になるシリーズの整理や、作品ごとの補助線として使えるガイドをまとめています。
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
                    <span className="catalog-card__badge">{CATEGORY_LABELS[guide.category] ?? guide.category}</span>
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
