import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { GuideContentRenderer } from "../../../components/GuideContentRenderer";
import { StructuredData } from "../../../components/StructuredData";
import { getGuideDetailBySlug, toPlainText, truncate } from "../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const DMM_PREMIUM_URL =
  "https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text";

export const revalidate = 3600;
export const dynamicParams = true;

const CATEGORY_LABELS: Record<string, string> = {
  "series-guides": "シリーズガイド",
  features: "編集部ピックアップ",
};

const FORMAT_LABELS: Record<string, string> = {
  stage: "舞台",
  musical: "ミュージカル",
};

const summarizePeriod = (period?: string | null) => {
  if (!period) return null;
  const match = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (!match) return period;
  return `${match[1]}/${match[2].padStart(2, "0")}-`;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideDetailBySlug(slug);

  if (!guide) {
    return {
      title: "ガイドが見つかりません | Stage Connect（ステコネ）",
      robots: { index: false, follow: false },
    };
  }

  const description = truncate(toPlainText(guide.summary || guide.content || guide.title), 150);

  return {
    title: `${guide.title} | Stage Connect（ステコネ）`,
    description,
    alternates: {
      canonical: `${siteUrl}/guide/${guide.slug}`,
    },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const guide = await getGuideDetailBySlug(slug);

  if (!guide) notFound();

  const description = toPlainText(guide.summary || guide.content || guide.title);
  const hasDmm = guide.relatedPlaySections.some((section) =>
    section.plays.some((play) => Boolean(play.vod?.dmm))
  );
  const totalPlays = guide.relatedPlaySections.reduce(
    (sum, section) => sum + section.plays.length,
    0
  );
  const dmmPlayCount = guide.relatedPlaySections.reduce(
    (sum, section) => sum + section.plays.filter((p) => Boolean(p.vod?.dmm)).length,
    0
  );

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description,
    url: `${siteUrl}/guide/${guide.slug}`,
    datePublished: guide.publishedAt || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/guide/${guide.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Stage Connect",
    },
    publisher: {
      "@type": "Organization",
      name: "Stage Connect",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "ガイド", item: `${siteUrl}/guide` },
      { "@type": "ListItem", position: 3, name: guide.title },
    ],
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={articleJsonLd} />
      <StructuredData data={breadcrumbJsonLd} />

      <div className="stack-lg">
        {/* --- Breadcrumb --- */}
        <Breadcrumbs
          items={[
            { label: "ガイド", href: "/guide" },
            { label: guide.title },
          ]}
        />

        {/* --- Hero --- */}
        <section className="hero-card stack-md">
          <div className="stack-sm">
            {guide.category ? (
              <div className="guide-category">{CATEGORY_LABELS[guide.category] ?? guide.category}</div>
            ) : null}

            <h1 className="page-title">{guide.title}</h1>

            {guide.publishedAt ? (
              <div className="catalog-note">{new Date(guide.publishedAt).toLocaleDateString("ja-JP")}</div>
            ) : null}

            {guide.summary ? <p className="lead">{guide.summary}</p> : null}
          </div>

          {(guide.relatedSeries.length > 0 || hasDmm) ? (
            <div className="catalog-summary catalog-summary--ledger">
              {guide.relatedSeries.length > 0 ? (
                <span className="catalog-chip">関連シリーズ {guide.relatedSeries.length}件</span>
              ) : null}
              {totalPlays > 0 ? (
                <span className="catalog-chip">関連作品 {totalPlays}作</span>
              ) : null}
              {hasDmm ? <span className="catalog-chip">DMM TV配信 {dmmPlayCount}作品</span> : null}
            </div>
          ) : null}
        </section>

        {/* --- 本文 --- */}
        {guide.content ? (
          <section className="section-card stack-md">
            <GuideContentRenderer content={guide.content} guide={guide} />
          </section>
        ) : null}

        {/* --- 関連シリーズ --- */}
        {guide.relatedSeries.length > 0 ? (
          <section className="section-card stack-md">
            <div className="stack-sm">
              <h2 className="section-title">関連シリーズ</h2>
              <p className="catalog-note">このガイドで扱っているシリーズ一覧です。各シリーズ詳細から関連作品や出演キャストを確認できます。</p>
            </div>

            <div className="guide-series-grid">
              {guide.relatedSeries.map((series) => (
                <article className="guide-series-card" key={series.id}>
                  <div className="guide-series-card__head">
                    <Link className="guide-series-card__title" href={series.slug ? `/series/${series.slug}` : "/series"}>
                      {series.name}
                    </Link>
                    {series.format ? (
                      <span className="catalog-card__badge">{FORMAT_LABELS[series.format] ?? series.format}</span>
                    ) : null}
                  </div>

                  <div className="guide-series-card__meta">
                    {series.playCount}作品
                    {series.originType ? ` / ${series.originType}` : ""}
                  </div>

                  <div className="guide-series-card__text">
                    {truncate(toPlainText(series.description || series.name), 90)}
                  </div>

                  <div className="guide-series-card__footer">
                    <Link className="catalog-link" href={series.slug ? `/series/${series.slug}` : "/series"}>
                      シリーズ詳細を見る
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- 歴代作品一覧 --- */}
        {guide.relatedPlaySections.length > 0 ? (
          <section className="section-card stack-md">
            <div className="stack-sm">
              <h2 className="section-title">歴代作品一覧</h2>
              <p className="catalog-note">関連シリーズに紐づく作品を自動で整理しています。作品詳細ページから出演キャストや配信状況を確認できます。</p>
            </div>

            <div className="stack-lg">
              {guide.relatedPlaySections.map((section) => (
                <div className="stack-md" key={section.series.id}>
                  <div className="section-header">
                    <h3 className="section-title" style={{ fontSize: "1.1rem" }}>{section.series.name}</h3>
                    {section.series.slug ? (
                      <Link className="inline-link" href={`/series/${section.series.slug}`}>
                        シリーズページへ
                      </Link>
                    ) : null}
                  </div>

                  <div className="guide-play-list">
                    {section.plays.map((play) => (
                      <article className="guide-play-row" key={play.id}>
                        <div className="guide-play-row__main">
                          <div className="guide-play-row__head">
                            <Link className="guide-play-row__title" href={`/plays/${play.slug}`}>
                              {play.title}
                            </Link>
                            {play.vod?.dmm ? <span className="catalog-card__badge">配信あり</span> : null}
                          </div>

                          <div className="guide-play-row__meta">
                            {summarizePeriod(play.period) ?? "公開時期未定"}
                          </div>

                          <div className="guide-play-row__summary">
                            {truncate(toPlainText(play.summary || play.title), 80)}
                          </div>
                        </div>

                        <div className="guide-play-row__actions">
                          <Link className="catalog-link" href={`/plays/${play.slug}`}>
                            作品詳細
                          </Link>
                          {play.vod?.dmm ? (
                            <a
                              className="action-button action-button-inline guide-play-row__cta"
                              href={play.vod.dmm}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                            >
                              DMM TV
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- 配信CTA --- */}
        {hasDmm ? (
          <section className="section-card stack-md">
            <div className="section-header-inline">
              <h2 className="section-title">配信で観る</h2>
              <a
                className="action-button action-button-primary"
                href={DMM_PREMIUM_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
              >
                14日間無料で試す
              </a>
            </div>
            <div className="prose-panel">
              このガイドで紹介している作品の多くはDMM TVで配信されています。
              月額550円・14日間の無料トライアルで、気になる作品が見放題に含まれているか確認してみてください。
            </div>
            <div className="catalog-summary">
              <span className="catalog-chip">DMM TV配信 {dmmPlayCount}作品</span>
              <span className="catalog-chip">月額550円</span>
              <span className="catalog-chip">14日間無料トライアル</span>
            </div>
            <div className="action-row">
              <Link className="action-button" href="/watch/dmm">
                DMM TV配信ガイド
              </Link>
              <Link className="action-button" href="/watch">
                配信サービス比較
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
