import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { StructuredData } from "../../../../components/StructuredData";
import { toEnglishOriginType, truncateText } from "../../../../lib/en-copy";
import { buildBreadcrumbList } from "../../../../lib/structured-data";
import { getSeriesDetailBySlug, toPlainText } from "../../../../lib/stage-connect";

type Params = { slug: string };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const revalidate = 3600;
export const dynamicParams = true;

const getStartYear = (periods: Array<string | null>) => {
  const years = periods
    .map((period) => String(period ?? "").match(/(\d{4})/)?.[1])
    .filter(Boolean)
    .map((year) => Number(year));

  if (years.length === 0) return null;
  return Math.min(...years);
};

const compactTimelinePeriod = (period?: string | null) => {
  if (!period) return "TBA";

  const slashDate = period.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashDate) {
    const [, year, month] = slashDate;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) return `${yearOnly[1]}-`;

  return period;
};

const hasVod = (vod?: Record<string, string> | null) => Boolean(vod?.dmm || vod?.danime || vod?.unext);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) {
    return {
      title: "Series not found | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  const description = truncateText(
    toPlainText(series.descriptionEn || series.description || `${series.name} series archive page on Stage Connect.`),
    150
  );

  return {
    title: `${series.name} | Series archive | Stage Connect`,
    description,
    alternates: {
      canonical: `${siteUrl}/en/series/${series.slug ?? slug}`,
      languages: {
        ja: `${siteUrl}/series/${series.slug ?? slug}`,
        en: `${siteUrl}/en/series/${series.slug ?? slug}`,
      },
    },
  };
}

export default async function EnglishSeriesDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const series = await getSeriesDetailBySlug(slug);

  if (!series) notFound();

  const startYear = getStartYear(series.plays.map((play) => play.period));
  const seriesOverview = series.descriptionEn || series.description;
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Series", path: "/en/series" },
    { name: series.name, path: `/en/series/${series.slug ?? slug}` },
  ]);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Series", href: "/en/series" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm detail-ledger-shell">
            <h1 className="page-title">{series.name}</h1>
            <div className="pill-row">
              <span className="pill accent-pill">{series.plays.length} plays</span>
              {series.originType ? <span className="pill">Origin: {toEnglishOriginType(series.originType)}</span> : null}
            </div>
            <div className="detail-ledger">
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Origin</span>
                <strong>{toEnglishOriginType(series.originType) || "Series"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Play count</span>
                <strong>{series.plays.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Started</span>
                <strong>{startYear ?? "--"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Series overview</h2>
          <div className="rich-text">{seriesOverview || "Series overview not available yet."}</div>

          {(series.originNote || series.productionCompanies.length > 0) && (
            <div className="meta-list roomy">
              {series.originNote ? (
                <div className="meta-row">
                  <div className="meta-label accent-label">Original work</div>
                  <div className="meta-value">{series.originNote}</div>
                </div>
              ) : null}
              {series.productionCompanies.length > 0 ? (
                <div className="meta-row">
                  <div className="meta-label accent-label">Production</div>
                  <div className="meta-value">{series.productionCompanies.join(" / ")}</div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        {series.topActors.length > 0 ? (
          <section className="section-card stack-md">
            <h2 className="section-title">Top recurring cast</h2>
            <div className="stack-sm">
              {series.topActors.slice(0, 12).map((item, index) => (
                <Link
                  key={`${item.actor.slug}-${index}`}
                  href={`/en/actors/${item.actor.slug}`}
                  className="cast-card cast-card-link"
                >
                  <div className="cast-name">{item.actor.name}</div>
                  <div className="cast-role">
                    {item.count} appearances
                    {item.roles.length > 0 ? ` / ${item.roles.slice(0, 2).join(" / ")}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-card stack-md">
          <div className="section-header-inline">
            <h2 className="section-title">Timeline</h2>
            {startYear ? <span className="pill">{startYear}-</span> : null}
          </div>

          <div className="timeline-shell">
            {series.plays.map((play) => (
              <section key={play.slug} className="timeline-year-block">
                <div className="timeline-dot" />
                <div className="timeline-year-heading">
                  <span className="timeline-year">{compactTimelinePeriod(play.period)}</span>
                  <span className="timeline-year-sub">release</span>
                </div>

                <article className="catalog-card">
                  <Link className="catalog-card__body-link" href={`/en/plays/${play.slug}`}>
                    <div className="catalog-card__top">
                      <div className="catalog-card__title">{play.title}</div>
                      {hasVod(play.vod) ? <span className="catalog-card__badge">Streaming</span> : null}
                    </div>

                    {play.summaryEn || play.summary ? (
                      <div className="catalog-card__text catalog-card__text--clamped">
                        {truncateText(toPlainText(play.summaryEn || play.summary), 220)}
                      </div>
                    ) : null}

                    <div className="catalog-card__footer">
                      <span className="catalog-link">View play details</span>
                    </div>
                  </Link>
                </article>
              </section>
            ))}
          </div>
        </section>

        {series.relatedSeries.length > 0 ? (
          <section className="section-card stack-md">
            <div className="section-header-inline">
              <div className="stack-sm">
                <h2 className="section-title">Related series</h2>
                <p className="catalog-note">Other branches or closely related series within the same title universe.</p>
              </div>
              <span className="pill">{series.relatedSeries.length}</span>
            </div>
            <div className="catalog-grid">
              {series.relatedSeries.map((item) => (
                <article className="catalog-card" key={item.id}>
                  <Link className="catalog-card__body-link" href={item.slug ? `/en/series/${item.slug}` : "/en/series"}>
                    <div className="catalog-card__top">
                      <div className="catalog-card__title">{item.name}</div>
                    </div>
                    {item.originType ? <div className="catalog-card__sub">{toEnglishOriginType(item.originType)}</div> : null}
                    <div className="catalog-card__text">
                      {item.descriptionEn || item.description
                        ? truncateText(toPlainText(item.descriptionEn || item.description), 140)
                        : "Related series archive."}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
