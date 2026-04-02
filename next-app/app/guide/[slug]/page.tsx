import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuideDetailBySlug, toPlainText, truncate } from "../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const revalidate = 3600;
export const dynamicParams = true;

const CATEGORY_LABELS: Record<string, string> = {
  "series-guides": "シリーズガイド",
  features: "編集部ピックアップ",
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideDetailBySlug(slug);

  if (!guide) {
    return {
      title: "ガイドが見つかりません | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${guide.title} | Stage Connect`,
    description: truncate(toPlainText(guide.summary || guide.content || guide.title), 150),
    alternates: {
      canonical: `/guide/${guide.slug}`,
    },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const guide = await getGuideDetailBySlug(slug);

  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: toPlainText(guide.summary || guide.content || guide.title),
    url: `${siteUrl}/guide/${guide.slug}`,
    datePublished: guide.publishedAt || undefined,
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div>
            <span className="eyebrow">Guide Detail SSR</span>
            <h1 className="page-title">{guide.title}</h1>
            {guide.category ? (
              <div className="muted mono" style={{ marginTop: 8, fontSize: 12 }}>
                {CATEGORY_LABELS[guide.category] ?? guide.category}
              </div>
            ) : null}
            {guide.publishedAt ? (
              <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                {new Date(guide.publishedAt).toLocaleDateString("ja-JP")}
              </div>
            ) : null}
          </div>
          {guide.summary ? <p className="lead">{guide.summary}</p> : null}
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">本文</h2>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>{guide.content || "本文は準備中です。"}</div>
        </section>
      </div>
    </main>
  );
}
