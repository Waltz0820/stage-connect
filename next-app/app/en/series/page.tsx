import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { PlayPosterFrame } from "../../../components/PlayPosterFrame";
import { StructuredData } from "../../../components/StructuredData";
import { EN_FORMAT_LABELS, getEnglishSeriesName, toEnglishOriginType, truncateText } from "../../../lib/en-copy";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../../lib/structured-data";
import { getSeriesList, toPlainText } from "../../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 12;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const getSingleParam = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value) ?? "";

const buildHref = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/en/series?${query}` : "/en/series";
};

export const metadata: Metadata = {
  title: "2.5D Series | Stage Connect",
  description:
    "Browse 2.5D stage and musical series by title, origin, and release structure.",
  alternates: {
    canonical: `${siteUrl}/en/series`,
    languages: {
      ja: `${siteUrl}/series`,
      en: `${siteUrl}/en/series`,
    },
  },
};

export default async function EnglishSeriesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allSeries = await getSeriesList();
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Series", path: "/en/series" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "2.5D Series",
    description:
      "Browse franchise lines, recurring stage adaptations, and long-running 2.5D projects.",
    path: "/en/series",
  });

  const requestedSort = getSingleParam(params.sort);
  const sort = requestedSort === "name_asc" ? "name_asc" : "play_count_desc";
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in EN_FORMAT_LABELS ? requestedFormat : "all";
  const origin = getSingleParam(params.origin) || "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const formatOptions = ["all", ...Object.keys(EN_FORMAT_LABELS)];
  const originOptions = [
    "all",
    ...Array.from(new Set(allSeries.map((series) => String(series.originType ?? "").trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "en")
    ),
  ];

  const formatFiltered =
    format === "all" ? allSeries : allSeries.filter((series) => String(series.format ?? "") === format);
  const filtered =
    origin === "all"
      ? formatFiltered
      : formatFiltered.filter((series) => String(series.originType ?? "").trim() === origin);

  const sorted = [...filtered].sort((a, b) => {
    const aName = getEnglishSeriesName(a);
    const bName = getEnglishSeriesName(b);
    if (sort === "name_asc") return aName.localeCompare(bName, "en");
    return b.playCount - a.playCount || aName.localeCompare(bName, "en");
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visible = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Series", href: "/en/series" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Series</span>
            <h1 className="page-title">2.5D Series</h1>
            <p className="lead">
              Browse franchise lines, recurring stage adaptations, and long-running 2.5D projects.
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">Showing {filtered.length}</span>
            <span className="catalog-chip">All series {allSeries.length}</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Filters</h2>

          <div className="filter-row filter-row--dense">
            <Link
              className={`filter-chip ${sort === "play_count_desc" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "play_count_desc", format, origin })}
            >
              Most plays
            </Link>
            <Link
              className={`filter-chip ${sort === "name_asc" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "name_asc", format, origin })}
            >
              Name A-Z
            </Link>
          </div>

          <div className="filter-row filter-row--dense genre-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format: option, origin })}
              >
                {option === "all" ? "All formats" : EN_FORMAT_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="filter-row filter-row--dense genre-filter-row">
            {originOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${origin === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format, origin: option })}
              >
                {option === "all" ? "All origins" : toEnglishOriginType(option) ?? option}
              </Link>
            ))}
          </div>

          <div className="catalog-grid catalog-grid--play-list">
            {visible.map((series) => (
              <article className="catalog-card catalog-card--play-list" key={series.slug}>
                <Link
                  className="play-list-card__poster-link"
                  href={`/en/series/${series.slug}`}
                  aria-label={getEnglishSeriesName(series)}
                >
                  <PlayPosterFrame
                    title={getEnglishSeriesName(series)}
                    subtitle={series.format ? EN_FORMAT_LABELS[series.format] ?? series.format : "Series"}
                    meta={`${series.playCount} plays`}
                    seed={`${series.slug}-${series.originType ?? ""}`}
                  />
                </Link>

                <div className="play-list-card__main">
                  <Link className="catalog-card__body-link" href={`/en/series/${series.slug}`}>
                    <div className="catalog-card__top catalog-card__top--stack">
                      <div className="catalog-card__title">{getEnglishSeriesName(series)}</div>
                      <div className="catalog-card__top-actions">
                        {format === "all" && series.format ? (
                          <span className="catalog-card__badge">
                            {EN_FORMAT_LABELS[series.format] ?? series.format}
                          </span>
                        ) : null}
                        <span className="catalog-card__badge">{series.playCount} plays</span>
                      </div>
                    </div>

                    {series.originType ? (
                      <div className="catalog-card__sub">{toEnglishOriginType(series.originType)}</div>
                    ) : null}

                    <div className="catalog-card__text">
                      {series.descriptionEn || series.description
                        ? truncateText(toPlainText(series.descriptionEn || series.description), 160)
                        : "Series description not available yet."}
                    </div>

                    <div className="catalog-card__footer">
                      <span className="catalog-link">View series details</span>
                    </div>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.max(1, safePage - 1), sort, format, origin })}
              >
                Previous
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, format, origin })}
              >
                Next
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
