import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { PlayPosterFrame } from "../../../components/PlayPosterFrame";
import { StructuredData } from "../../../components/StructuredData";
import {
  compactListPeriodEn,
  EN_FORMAT_LABELS,
  EN_GENRE_LABELS,
  getEnglishPlayTitle,
  getEnglishSeriesName,
  truncateText,
} from "../../../lib/en-copy";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../../lib/structured-data";
import { getPlayList, periodSortKey, toPlainText } from "../../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 12;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const getPlayReleaseLabelEn = (period?: string | null) => {
  if (!period) return null;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slashDate = period.match(/(\d{4})\/(\d{1,2})/);
  if (slashDate) {
    const [, year, month] = slashDate;
    const monthIndex = Number(month) - 1;
    return monthNames[monthIndex] ? `${monthNames[monthIndex]} ${year}` : year;
  }

  const jpDate = period.match(/(\d{4})年\s*(\d{1,2})月/);
  if (jpDate) {
    const [, year, month] = jpDate;
    const monthIndex = Number(month) - 1;
    return monthNames[monthIndex] ? `${monthNames[monthIndex]} ${year}` : year;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    const monthIndex = Number(month) - 1;
    return monthNames[monthIndex] ? `${monthNames[monthIndex]} ${year}` : year;
  }

  const yearOnly = period.match(/(\d{4})/);
  return yearOnly ? yearOnly[1] : null;
};

const getPlayAvailabilityLabelEn = (vod?: Record<string, string> | null) => {
  if (vod?.dmm) return "Streaming on DMM TV";
  if (vod && Object.keys(vod).length > 0) return "Streaming available";
  return "No streaming info";
};

const getPlayCardTagsEn = (play: {
  franchiseFormat: string | null;
  genre: string | null;
  franchiseName: string | null;
  vod: Record<string, string> | null;
}) => {
  const tags = [
    play.vod?.dmm ? "Streaming" : null,
    play.franchiseFormat ? EN_FORMAT_LABELS[play.franchiseFormat] ?? play.franchiseFormat : null,
    play.genre ? EN_GENRE_LABELS[play.genre] ?? play.genre : null,
    play.franchiseName ? "Series title" : null,
  ].filter(Boolean) as string[];

  return Array.from(new Set(tags)).slice(0, 4);
};

const getSingleParam = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value) ?? "";

const buildHref = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/en/plays?${query}` : "/en/plays";
};

export const metadata: Metadata = {
  title: "2.5D Plays | Stage Connect",
  description:
    "Browse 2.5D stage plays and musicals by release order and genre on Stage Connect.",
  alternates: {
    canonical: `${siteUrl}/en/plays`,
    languages: {
      ja: `${siteUrl}/plays`,
      en: `${siteUrl}/en/plays`,
    },
  },
};

export default async function EnglishPlaysPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allPlays = await getPlayList();
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Plays", path: "/en/plays" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "2.5D Plays",
    description:
      "Browse 2.5D stage plays and musicals by release order, performance format, and genre.",
    path: "/en/plays",
  });

  const sort = getSingleParam(params.sort) === "old" ? "old" : "new";
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in EN_FORMAT_LABELS ? requestedFormat : "all";
  const requestedGenre = getSingleParam(params.genre);
  const genre = requestedGenre && requestedGenre in EN_GENRE_LABELS ? requestedGenre : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const formatOptions = ["all", ...Object.keys(EN_FORMAT_LABELS)];
  const genreOptions = ["all", ...Object.keys(EN_GENRE_LABELS)];

  const formatFiltered =
    format === "all" ? allPlays : allPlays.filter((play) => String(play.franchiseFormat ?? "") === format);
  const filtered =
    genre === "all" ? formatFiltered : formatFiltered.filter((play) => String(play.genre ?? "") === genre);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "old") return periodSortKey(a.period) - periodSortKey(b.period);
    return periodSortKey(b.period) - periodSortKey(a.period);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visible = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container works-index-page" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Plays", href: "/en/plays" }]} />

        <section className="hero-card stack-md works-index-hero">
          <div className="stack-sm">
            <span className="eyebrow">Plays</span>
            <h1 className="page-title">2.5D Plays</h1>
            <p className="lead">
              Browse stage plays and musicals by release order, performance format, and genre.
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">Showing {filtered.length}</span>
            <span className="catalog-chip">All plays {allPlays.length}</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md works-list-panel">
          <h2 className="section-title">Filters</h2>

          <div className="filter-row filter-row--dense works-filter-row">
            <Link
              className={`filter-chip ${sort === "new" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "new", format, genre })}
            >
              Newest first
            </Link>
            <Link
              className={`filter-chip ${sort === "old" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "old", format, genre })}
            >
              Oldest first
            </Link>
          </div>

          <div className="filter-row filter-row--dense genre-filter-row works-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format: option, genre })}
              >
                {option === "all" ? "All formats" : EN_FORMAT_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="filter-row filter-row--dense genre-filter-row works-filter-row">
            {genreOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${genre === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format, genre: option })}
              >
                {option === "all" ? "All genres" : EN_GENRE_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="catalog-grid catalog-grid--play-list">
            {visible.map((play) => (
              <article className="catalog-card catalog-card--play-list" key={play.slug}>
                <Link
                  className="play-list-card__poster-link"
                  href={`/en/plays/${play.slug}`}
                  aria-label={getEnglishPlayTitle(play)}
                >
                  <PlayPosterFrame
                    title={getEnglishPlayTitle(play)}
                    meta={compactListPeriodEn(play.period)}
                    seed={`${play.slug}-${play.genre ?? ""}`}
                  />
                </Link>

                <div className="play-list-card__main">
                  <div className="catalog-card__top catalog-card__top--stack">
                    <div className="play-list-card__status-row">
                      {play.vod?.dmm ? (
                        <span className="play-list-card__status-badge play-list-card__status-badge--accent">
                          Streaming
                        </span>
                      ) : null}
                      {play.franchiseFormat ? (
                        <span className="play-list-card__status-badge">
                          {EN_FORMAT_LABELS[play.franchiseFormat] ?? play.franchiseFormat}
                        </span>
                      ) : null}
                    </div>

                    <div className="catalog-card__title">{getEnglishPlayTitle(play)}</div>
                  </div>

                  <Link className="catalog-card__body-link" href={`/en/plays/${play.slug}`}>
                    {play.franchiseName ? (
                      <div className="catalog-card__sub play-list-card__series">
                        {getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn })}
                      </div>
                    ) : null}

                    <div className="catalog-card__text play-list-card__summary">
                      {play.summaryEn || play.summary
                        ? truncateText(toPlainText(play.summaryEn || play.summary), 160)
                        : "Summary not available yet."}
                    </div>

                    <div className="play-list-card__facts">
                      {getPlayReleaseLabelEn(play.period) ? (
                        <div className="play-list-card__fact">
                          <span className="play-list-card__fact-icon" aria-hidden="true">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                              <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
                              <path d="M5 2.5v2M11 2.5v2M2.5 6.5h11" />
                            </svg>
                          </span>
                          <span className="play-list-card__fact-key">Release</span>
                          <span className="play-list-card__fact-value">{getPlayReleaseLabelEn(play.period)}</span>
                        </div>
                      ) : null}
                      <div className="play-list-card__fact">
                        <span className="play-list-card__fact-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <circle cx="8" cy="5" r="2.5" />
                            <path d="M3.5 13c.5-2.6 2.5-4 4.5-4s4 1.4 4.5 4" />
                          </svg>
                        </span>
                        <span className="play-list-card__fact-key">Main cast</span>
                        <span className="play-list-card__fact-value">{play.mainCastSummaryEn || "Not listed"}</span>
                      </div>
                      <div className="play-list-card__fact">
                        <span className="play-list-card__fact-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="2.5" y="3.5" width="11" height="9" rx="2" />
                            <path d="M7 6.4 10 8 7 9.6Z" fill="currentColor" stroke="none" />
                          </svg>
                        </span>
                        <span className="play-list-card__fact-key">Streaming</span>
                        <span className="play-list-card__fact-value">{getPlayAvailabilityLabelEn(play.vod)}</span>
                      </div>
                    </div>

                    <div className="play-list-card__tag-row">
                      {getPlayCardTagsEn(play).map((tag) => (
                        <span className="play-list-card__tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="catalog-card__footer play-list-card__footer">
                      <span className="catalog-link">View play details</span>
                      <span className="play-list-card__chevron" aria-hidden="true">
                        ›
                      </span>
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
                href={buildHref({ page: Math.max(1, safePage - 1), sort, format, genre })}
              >
                Previous
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, format, genre })}
              >
                Next
              </Link>
            </div>
          ) : null}

          <div className="works-index-cta">
            <div className="works-index-cta__icon" aria-hidden="true">
              □
            </div>
            <div className="works-index-cta__copy">
              <p className="works-index-cta__title">Browse from series</p>
              <p className="works-index-cta__text">Jump into popular franchise lines and connected productions.</p>
            </div>
            <Link className="works-index-cta__link" href="/en/series">
              View series
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
