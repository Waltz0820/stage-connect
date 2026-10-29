import { DirectoryEmpty } from "../../../components/DirectoryEmpty";
import { DirectorySearchForm } from "../../../components/DirectorySearchForm";
import { DirectorySeriesName } from "../../../components/DirectorySeriesName";
import { DirectoryHero } from "../../../components/DirectoryHero";
import { matchesSearch, normalizeSearchQuery } from '../../../lib/search-query';
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { StructuredData } from "../../../components/StructuredData";
import { EN_FORMAT_LABELS, getEnglishSeriesName, toEnglishOriginType } from "../../../lib/en-copy";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../../lib/structured-data";
import { getDirectorySeries } from "../../../lib/directory-cache";

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
  description: "Browse 2.5D stage and musical series by title, origin, and release structure.",
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
  const allSeries = await getDirectorySeries();
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Series", path: "/en/series" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "2.5D Series",
    description: "Browse franchise lines, recurring stage adaptations, and long-running 2.5D projects.",
    path: "/en/series",
  });

  const q = normalizeSearchQuery(getSingleParam(params.q));
  const matchingSeries = allSeries.filter(item => matchesSearch([item.name,item.nameEn,item.slug],q));
  const requestedSort = getSingleParam(params.sort);
  const sort = requestedSort === "name_asc" ? "name_asc" : "play_count_desc";
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in EN_FORMAT_LABELS ? requestedFormat : "all";
  const origin = getSingleParam(params.origin) || "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const formatOptions = ["all", ...Object.keys(EN_FORMAT_LABELS)];
  const originOptions = [
    "all",
    ...Array.from(new Set(allSeries.map((series) => String(series.originType ?? "").trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "en")
    ),
  ];

  const formatFiltered =
    format === "all" ? matchingSeries : matchingSeries.filter((series) => String(series.format ?? "") === format);
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
    <main className="container works-index-page series-index-page editorial-directory directory--series">
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Series", href: "/en/series" }]} />

        <DirectoryHero kind="series" title="2.5D Series" />

        <section className="section-card stack-md works-list-panel">
          <h2 className="section-title">Series Filters</h2>

          <DirectorySearchForm className="v2-search" action="/en/series">
            <label className="sr-only" htmlFor="series-query">Search series</label>
            <input id="series-query" name="q" defaultValue={q} placeholder="Search by series name"/>
            <input type="hidden" name="sort" value={sort}/><input type="hidden" name="format" value={format}/><input type="hidden" name="origin" value={origin}/>
            <button type="submit" aria-label="Search">→</button>
          </DirectorySearchForm>

          <div className="filter-row filter-row--dense works-filter-row">
            <Link
              className={`filter-chip ${sort === "play_count_desc" ? "is-active" : ""}`}
              href={buildHref({ q, page: 1, sort: "play_count_desc", format, origin })}
            >
              Most plays
            </Link>
            <Link
              className={`filter-chip ${sort === "name_asc" ? "is-active" : ""}`}
              href={buildHref({ q, page: 1, sort: "name_asc", format, origin })}
            >
              Name A-Z
            </Link>
          </div>

          <fieldset className="directory-choice-group"><legend>Format</legend>
          <div className="filter-row filter-row--dense genre-filter-row works-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ q, page: 1, sort, format: option, origin })}
              >
                {option === "all" ? "All formats" : EN_FORMAT_LABELS[option]}
              </Link>
            ))}
          </div>
          </fieldset>

          <fieldset className="directory-choice-group"><legend>Original source</legend>
          <div className="filter-row filter-row--dense genre-filter-row works-filter-row">
            {originOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${origin === option ? "is-active" : ""}`}
                href={buildHref({ q, page: 1, sort, format, origin: option })}
              >
                {option === "all" ? "All origins" : toEnglishOriginType(option) ?? option}
              </Link>
            ))}
          </div>
          </fieldset>

          <p className="catalog-count"><strong>{filtered.length.toLocaleString()}</strong> series</p>
          {filtered.length === 0 ? <DirectoryEmpty locale="en" kind="series" /> : null}

          <div className="catalog-grid catalog-grid--play-list">
            {visible.map((series) => (
              <article className="catalog-card catalog-card--play-list" key={series.slug}>
                <Link className="directory-play-link" href={`/en/series/${series.slug}`}>


                <div className="play-list-card__main">
                  <div className="catalog-card__body-link">
                    <DirectorySeriesName slug={series.slug} locale="en" />
                    <div className="catalog-card__top catalog-card__top--stack">
                      <div className="catalog-card__title">{getEnglishSeriesName(series)}</div>
                    </div>



                    <div className="play-list-card__facts">
                      <div className="play-list-card__fact">
                        <span className="play-list-card__fact-icon" aria-hidden="true">
                          <svg viewBox="0 0 20 20" fill="none">
                            <path
                              d="M10 3 15.5 6v8L10 17l-5.5-3V6L10 3Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                            <path d="M4.5 6 10 9l5.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M10 9v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="play-list-card__fact-key">Works</span>
                        <span className="play-list-card__fact-value">{series.playCount} plays</span>
                      </div>

                      {series.format ? (
                        <div className="play-list-card__fact">
                          <span className="play-list-card__fact-icon" aria-hidden="true">
                            <svg viewBox="0 0 20 20" fill="none">
                              <path
                                d="M3.5 6.5A2.5 2.5 0 0 1 6 4h8a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 14 16H6a2.5 2.5 0 0 1-2.5-2.5v-7Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path d="M7 8.5h6M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span className="play-list-card__fact-key">Format</span>
                          <span className="play-list-card__fact-value">
                            {EN_FORMAT_LABELS[series.format] ?? series.format}
                          </span>
                        </div>
                      ) : null}

                      {series.originType ? (
                        <div className="play-list-card__fact">
                          <span className="play-list-card__fact-icon" aria-hidden="true">
                            <svg viewBox="0 0 20 20" fill="none">
                              <path
                                d="M10 3.5c2.3 0 4.2 1 5.4 2.7C16.8 8 17 10.4 15.8 12c-1.1 1.6-3.1 2.5-5.8 4.5-2.7-2-4.7-2.9-5.8-4.5C3 10.4 3.2 8 4.6 6.2 5.8 4.5 7.7 3.5 10 3.5Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span className="play-list-card__fact-key">Origin</span>
                          <span className="play-list-card__fact-value">
                            {toEnglishOriginType(series.originType) ?? series.originType}
                          </span>
                        </div>
                      ) : null}
                    </div>


                    <span className="directory-card-arrow" aria-hidden="true">→</span>
                  </div>
                </div>
                </Link>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                aria-disabled={safePage === 1 || undefined} tabIndex={safePage === 1 ? -1 : undefined}
                href={buildHref({ q, page: Math.max(1, safePage - 1), sort, format, origin })}
              >
                Previous
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                aria-disabled={safePage === totalPages || undefined} tabIndex={safePage === totalPages ? -1 : undefined}
                href={buildHref({ q, page: Math.min(totalPages, safePage + 1), sort, format, origin })}
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
              <p className="works-index-cta__title">Browse related plays from each series</p>
              <p className="works-index-cta__text">Jump from a franchise overview to its connected plays and streaming status.</p>
            </div>
            <Link className="works-index-cta__link" href="/en/plays">
              View plays
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
