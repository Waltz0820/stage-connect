import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { GuideContentRenderer, extractTocHeadings } from "../../../components/GuideContentRenderer";
import { GuideTopActorsClient } from "../../../components/GuideTopActorsClient";
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

const STAGE_SERIES_PLACEHOLDER = "[刀ステ シリーズ一覧ページへのリンク]";
const MUSICAL_SERIES_PLACEHOLDER = "[刀ミュ シリーズ一覧ページへのリンク]";

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
  const hasInlineSeriesLinks = Boolean(
    guide.content?.includes(STAGE_SERIES_PLACEHOLDER) || guide.content?.includes(MUSICAL_SERIES_PLACEHOLDER)
  );
  const totalPlays = guide.relatedPlaySections.reduce((sum, section) => sum + section.plays.length, 0);
  const dmmPlayCount = guide.relatedPlaySections.reduce(
    (sum, section) => sum + section.plays.filter((play) => Boolean(play.vod?.dmm)).length,
    0
  );
  const tocItems = guide.content ? extractTocHeadings(guide.content) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description,
    url: `${siteUrl}/guide/${guide.slug}`,
    datePublished: guide.publishedAt || undefined,
    author: {
      "@type": "Organization",
      name: "Stage Connect",
    },
    publisher: {
      "@type": "Organization",
      name: "Stage Connect",
    },
  };

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={jsonLd} />

      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "編集部ガイド", href: "/guide" }, { label: guide.title }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm">
            {guide.category ? (
              <div className="guide-category">{CATEGORY_LABELS[guide.category] ?? guide.category}</div>
            ) : null}

            <h1 className="page-title page-title--guide">{guide.title}</h1>

            {guide.publishedAt ? (
              <div className="catalog-note">{new Date(guide.publishedAt).toLocaleDateString("ja-JP")}</div>
            ) : null}

            {guide.summary ? <p className="lead">{guide.summary}</p> : null}
          </div>

          {(guide.relatedSeries.length > 0 || hasDmm) ? (
            <div className="catalog-summary catalog-summary--ledger">
              {guide.relatedSeries.length > 0 ? (
                <span className="catalog-chip">関連シリーズ {guide.relatedSeries.length} 件</span>
              ) : null}
              {totalPlays > 0 ? <span className="catalog-chip">関連作品 {totalPlays} 件</span> : null}
              {hasDmm ? <span className="catalog-chip">DMM TV対応 {dmmPlayCount} 作品</span> : null}
            </div>
          ) : null}
        </section>

        {tocItems.length >= 2 ? (
          <nav className="section-card guide-toc" aria-label="目次">
            <h2 className="guide-toc__title">目次</h2>
            <ol className="guide-toc__list">
              {tocItems.map((item) => (
                <li key={item.id} className="guide-toc__item">
                  <a className="guide-toc__link" href={`#${item.id}`}>
                    {item.text}
                  </a>
                </li>
              ))}
              {(guide.topActorsByFormat.stage.length > 0 || guide.topActorsByFormat.musical.length > 0) ? (
                <li className="guide-toc__item guide-toc__item--sub">
                  <a className="guide-toc__link" href="#top-cast">
                    主な出演キャスト
                  </a>
                </li>
              ) : null}
            </ol>
          </nav>
        ) : null}

        {guide.content ? (
          <section className="section-card stack-md">
            <GuideContentRenderer content={guide.content} guide={guide} />
          </section>
        ) : null}

        {guide.topActorsByFormat.stage.length > 0 || guide.topActorsByFormat.musical.length > 0 ? (
          <section className="section-card stack-md">
            <div className="stack-sm">
              <h2 className="section-title" id="top-cast">
                主な出演キャスト
              </h2>
              <p className="catalog-note">舞台 / ミュージカル それぞれの主な出演者を掲載しています。</p>
            </div>

            <GuideTopActorsClient
              stageActors={guide.topActorsByFormat.stage}
              musicalActors={guide.topActorsByFormat.musical}
              relatedSeries={guide.relatedSeries}
              hideSeriesLinks={hasInlineSeriesLinks}
            />
          </section>
        ) : null}

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
              舞台 / ミュージカル『刀剣乱舞』の作品の多くは DMM TV で配信されています。まずは無料トライアルで、
              気になる作品の配信状況を確認してみてください。
            </div>
            <div className="catalog-summary">
              <span className="catalog-chip">DMM TV対応 {dmmPlayCount} 作品</span>
              <span className="catalog-chip">14日間無料トライアル</span>
              <span className="catalog-chip">月額 550円</span>
            </div>
            <div className="inline-links">
              <Link className="action-button" href="/watch">
                配信ステータス一覧を見る
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
