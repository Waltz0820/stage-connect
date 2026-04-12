import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideContentRenderer } from "../../../components/GuideContentRenderer";
import { StructuredData } from "../../../components/StructuredData";
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

const FORMAT_LABELS: Record<string, string> = {
  stage: "舞台",
  musical: "ミュージカル",
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
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <div className="inline-links">
              <Link className="inline-link" href="/guide">
                編集部ガイド
              </Link>
            </div>

            {guide.category ? (
              <div className="guide-category">{CATEGORY_LABELS[guide.category] ?? guide.category}</div>
            ) : null}

            <h1 className="page-title">{guide.title}</h1>

            {guide.publishedAt ? (
              <div className="catalog-note">{new Date(guide.publishedAt).toLocaleDateString("ja-JP")}</div>
            ) : null}

            {guide.summary ? <p className="lead">{guide.summary}</p> : null}
          </div>

          {guide.relatedSeries.length > 0 ? (
            <div className="catalog-summary catalog-summary--ledger">
              <span className="catalog-chip">関連シリーズ {guide.relatedSeries.length}件</span>
              <span className="catalog-chip">関連作品 {guide.relatedPlaySections.reduce((sum, section) => sum + section.plays.length, 0)}作</span>
              {hasDmm ? <span className="catalog-chip">DMM TV配信作品あり</span> : null}
            </div>
          ) : null}
        </section>

        {guide.content ? (
          <section className="section-card stack-md">
            <h2 className="section-title">本文</h2>
            <GuideContentRenderer content={guide.content} />
          </section>
        ) : null}

        {guide.relatedSeries.length > 0 ? (
          <section className="section-card stack-md">
            <div className="stack-sm">
              <h2 className="section-title">関連シリーズ</h2>
              <p className="catalog-note">このガイドで扱っているシリーズ一覧です。各シリーズ詳細から関連作品や出演キャストを確認できます。</p>
            </div>

            <div className="catalog-grid">
              {guide.relatedSeries.map((series) => (
                <article className="catalog-card" key={series.id}>
                  <div className="catalog-card__top">
                    <Link className="catalog-card__title" href={series.slug ? `/series/${series.slug}` : "/series"}>
                      {series.name}
                    </Link>
                    {series.format ? (
                      <span className="catalog-card__badge">{FORMAT_LABELS[series.format] ?? series.format}</span>
                    ) : null}
                  </div>

                  <div className="catalog-card__sub">
                    {series.playCount}作品
                    {series.originType ? ` / ${series.originType}` : ""}
                  </div>

                  <div className="catalog-card__text">
                    {truncate(toPlainText(series.description || series.name), 140)}
                  </div>

                  <div className="catalog-card__footer">
                    <Link className="catalog-link" href={series.slug ? `/series/${series.slug}` : "/series"}>
                      シリーズ詳細を見る
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

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

                  <div className="catalog-grid">
                    {section.plays.map((play) => (
                      <article className="catalog-card" key={play.id}>
                        <div className="catalog-card__top">
                          <Link className="catalog-card__title" href={`/plays/${play.slug}`}>
                            {play.title}
                          </Link>
                          {play.vod?.dmm ? <span className="catalog-card__badge">配信あり</span> : null}
                        </div>

                        {play.period ? <div className="catalog-card__sub">{play.period}</div> : null}

                        <div className="catalog-card__text">
                          {truncate(toPlainText(play.summary || play.title), 150)}
                        </div>

                        <div className="catalog-card__footer">
                          <Link className="catalog-link" href={`/plays/${play.slug}`}>
                            作品詳細を見る
                          </Link>
                        </div>

                        <div className={`catalog-card__footer catalog-card__footer--cta${play.vod?.dmm ? "" : " is-empty"}`}>
                          {play.vod?.dmm ? (
                            <a
                              className="action-button action-button-inline"
                              href={play.vod.dmm}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                            >
                              DMM TVで見る
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

        {hasDmm ? (
          <section className="section-card stack-md">
            <div className="stack-sm">
              <h2 className="section-title">配信で観る</h2>
              <p className="catalog-note">配信状況は作品ごとに変動するため、視聴前に最新状況を確認してください。</p>
            </div>

            <div className="inline-links">
              <a className="action-button" href="/watch">
                配信ガイドを見る
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
