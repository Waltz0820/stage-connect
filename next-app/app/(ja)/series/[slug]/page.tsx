import { AnchorTabs } from "../../../../components/AnchorTabs";
import { compactPerformancePeriod, getPerformanceStart } from "../../../../lib/performance-period";
import type { Metadata } from "next";
import { ProductionMark } from "../../../../components/ProductionMark";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { RelatedSeriesClient } from "../../../../components/RelatedSeriesClient";
import { SeriesCastOverviewClient } from "../../../../components/SeriesCastOverviewClient";
import { StructuredData } from "../../../../components/StructuredData";
import { buildBreadcrumbList } from "../../../../lib/structured-data";
import { getSeriesDetailBySlug, toPlainText, truncate } from "../../../../lib/stage-connect";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const getStartYear = (periods: Array<string | null>) => {
  const years = periods
    .map((period) => getPerformanceStart(period)?.year)
    .filter(Boolean)
    .map((year) => Number(year));

  if (years.length === 0) return null;
  return Math.min(...years);
};

const compactTimelinePeriod = (period?: string | null) => compactPerformancePeriod(period, "ja");

const hasVod = (vod?: Record<string, string> | null) => Boolean(vod?.dmm || vod?.danime || vod?.unext);

const buildSeriesMetaDescriptionJa = (series: NonNullable<Awaited<ReturnType<typeof getSeriesDetailBySlug>>>) => {
  const parts: string[] = [];
  const overview = toPlainText(series.description || "").trim().replace(/[。．]\s*$/u, "");

  if (overview) parts.push(`${overview}。`);

  const factParts: string[] = [];
  if (series.originType) factParts.push(series.originType);
  if (series.plays.length > 0) factParts.push(`${series.plays.length}作`);
  const startYear = getStartYear(series.plays.map((play) => play.period));
  if (startYear) factParts.push(`開始年${startYear}年`);
  if (factParts.length > 0) parts.push(`${factParts.join(" / ")}。`);

  if (parts.length === 0) {
    parts.push(`${series.name}のシリーズ一覧と出演キャストをまとめたページです。`);
  } else {
    parts.push("年表、出演キャスト・役柄一覧、関連シリーズを掲載。");
  }

  return truncate(parts.join(" "), 150);
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) {
    return {
      title: "シリーズが見つかりません | Stage Connect（ステコネ）",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${series.name} | シリーズ詳細 | Stage Connect（ステコネ）`,
    description: buildSeriesMetaDescriptionJa(series),
    alternates: {
      canonical: `${siteUrl}/series/${series.slug ?? slug}`,
      languages: {
        ja: `${siteUrl}/series/${series.slug ?? slug}`,
        en: `${siteUrl}/en/series/${series.slug ?? slug}`,
      },
    },
  };
}

export default async function SeriesDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) notFound();

  const startYear = getStartYear(series.plays.map((play) => play.period));

  const seriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: series.name,
    description: toPlainText(series.description || `${series.name}のシリーズ一覧と出演キャストをまとめたページです。`),
    url: `${siteUrl}/series/${series.slug ?? slug}`,
    hasPart: series.plays.slice(0, 50).map((play) => ({
      "@type": "CreativeWork",
      name: play.title,
      url: `${siteUrl}/plays/${play.slug}`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "登録されている作品数は？",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${series.plays.length}作品を掲載しています。`,
        },
      },
      {
        "@type": "Question",
        name: "公演順はどこで確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "公演年表で各作品の上演時期を確認できます。",
        },
      },
      {
        "@type": "Question",
        name: "出演キャストも確認できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "キャスト・役柄一覧から各俳優のプロフィールや出演歴を確認できます。",
        },
      },
    ],
  };

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "シリーズ一覧", path: "/series" },
    { name: series.name, path: `/series/${series.slug ?? slug}` },
  ]);

  return (
    <main className="container works-index-page detail-stage-page editorial-detail series-detail-stage-page">
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={seriesJsonLd} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "シリーズ一覧", href: "/series" }, { label: series.name }]} />

        <section className="hero-card stack-md detail-stage-hero series-detail-stage-hero">
          <div className="stack-sm detail-ledger-shell">
            <div className="detail-title-row"><ProductionMark kind="series" seriesSlug={series.slug}/><h1 className="page-title">{series.name}</h1></div>
            <div className="detail-ledger">
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">種別</span>
                <strong>{series.originType || "シリーズ"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">作品数</span>
                <strong>{series.plays.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">開始年</span>
                <strong>{startYear ?? "--"}</strong>
              </div>
            </div>
          </div>
        </section>

        <AnchorTabs label="シリーズ情報の目次" items={[
          { id: "series-overview", label: "概要" },
          { id: "timeline", label: "年表" },
          { id: "series-cast", label: "キャスト" },
          ...(series.relatedSeries.length ? [{ id: "related-series", label: "関連シリーズ" }] : []),
        ]} />

        <section id="series-overview" className="section-card stack-md detail-stage-section">
          <h2 className="section-title">シリーズ情報</h2>
          <div className="rich-text">{series.description || `${series.name}のシリーズ情報を掲載しています。`}</div>

          {(series.originNote || series.productionCompanies.length > 0) && (
            <div className="meta-list roomy">
              {series.originNote ? (
                <div className="meta-row">
                  <div className="meta-label accent-label">原作・出典</div>
                  <div className="meta-value">{series.originNote}</div>
                </div>
              ) : null}
              {series.productionCompanies.length > 0 ? (
                <div className="meta-row">
                  <div className="meta-label accent-label">主催・関係会社</div>
                  <div className="meta-value">{series.productionCompanies.join(" / ")}</div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section id="timeline" className="section-card stack-md detail-stage-section series-timeline-section">
          <div className="section-header-inline">
            <h2 className="section-title">年表</h2>
            {startYear ? <span className="pill">{startYear}年〜</span> : null}
          </div>

          <div className="timeline-shell">
            {series.plays.map((play) => (
              <section key={play.slug} className="timeline-year-block">
                <div className="timeline-dot" />
                <div className="timeline-year-heading">
                  <span className="timeline-year">{compactTimelinePeriod(play.period)}</span>
                  <span className="timeline-year-sub">公演時期</span>
                </div>

                <article className="catalog-card actor-timeline-card series-timeline-card" data-streaming-placement="series_timeline" data-play-id={play.id} data-play-slug={play.slug}>
                  <Link className="catalog-card__body-link actor-timeline-card__link" href={`/plays/${play.slug}`}>
                    <div className="actor-timeline-card__body">
                      <div className="catalog-card__top">
                        <div className="cast-name">{play.title}</div>
                        {hasVod(play.vod) ? <span className="catalog-card__badge">配信リンクあり</span> : null}
                      </div>

                      <div className="series-timeline-card__meta">
                        <span>{compactTimelinePeriod(play.period)}</span>
                      </div>

                      {toPlainText(play.summary) ? (
                        <p className="timeline-excerpt">{truncate(toPlainText(play.summary), 220)}</p>
                      ) : null}
                    </div>
                  </Link>

                  <div className="catalog-card__footer">
                    <div className="action-row">
                      <Link className="action-button action-button-primary" href={`/plays/${play.slug}`}>
                        作品詳細を見る
                      </Link>
                      {play.vod?.dmm ? (
                        <a className="action-button" href={play.vod.dmm} target="_blank" rel="sponsored noopener noreferrer">
                          DMM TV
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              </section>
            ))}
          </div>
        </section>

        <SeriesCastOverviewClient topActors={series.topActors} />

        {series.relatedSeries.length > 0 ? (
          <section id="related-series" className="section-card stack-md detail-stage-section">
            <div className="section-header-inline">
              <div className="stack-sm">
                <h2 className="section-title">関連シリーズ</h2>
                <p className="catalog-note">同じ作品タイトルで派生しているシリーズをまとめています。</p>
              </div>
              <span className="pill">{series.relatedSeries.length}件</span>
            </div>
            <RelatedSeriesClient items={series.relatedSeries} />
          </section>
        ) : null}

        <section className="section-card stack-md detail-stage-section">
          <h2 className="section-title">よくある質問（FAQ）</h2>
          <div className="faq-grid">
            <article className="faq-card">
              <h3 className="faq-question">Q. 登録されている作品数は？</h3>
              <p className="faq-answer">
                {series.plays.length}作品を掲載しています。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 公演順はどこで確認できますか？</h3>
              <p className="faq-answer">
                公演年表で各作品の上演時期を確認できます。
              </p>
            </article>
            <article className="faq-card">
              <h3 className="faq-question">Q. 出演キャストも確認できますか？</h3>
              <p className="faq-answer">
                キャスト・役柄一覧から各俳優のプロフィールや出演歴を確認できます。
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
