import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { PlayPosterFrame } from "../../components/PlayPosterFrame";
import { StructuredData } from "../../components/StructuredData";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../lib/structured-data";
import { getSeriesList, toPlainText, truncate } from "../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 10;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const FORMAT_LABELS: Record<string, string> = {
  stage: "舞台",
  musical: "ミュージカル",
};

const getSingleParam = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value) ?? "";

const getSeriesCardTags = (series: { format: string | null; originType: string | null; playCount: number }) => {
  const tags = [
    series.format ? FORMAT_LABELS[series.format] ?? series.format : null,
    series.originType,
    series.playCount >= 10 ? "人気シリーズ" : null,
  ].filter(Boolean) as string[];

  return Array.from(new Set(tags)).slice(0, 4);
};

const buildHref = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/series?${query}` : "/series";
};

export const metadata: Metadata = {
  title: "シリーズ一覧 | Stage Connect",
  description: "2.5次元舞台・ミュージカルのシリーズを、作品数・上演形式・原作ジャンルごとに一覧で探せます。",
  alternates: {
    canonical: `${siteUrl}/series`,
    languages: {
      ja: `${siteUrl}/series`,
      en: `${siteUrl}/en/series`,
    },
  },
};

export default async function SeriesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allSeries = await getSeriesList();
  const featuredSeries = [...allSeries].sort(
    (a, b) => b.playCount - a.playCount || a.name.localeCompare(b.name, "ja")
  )[0] ?? null;
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "シリーズ一覧", path: "/series" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "シリーズ一覧",
    description: "2.5次元舞台・ミュージカルのシリーズを、作品数・上演形式・原作ジャンルごとに一覧で探せます。",
    path: "/series",
  });

  const requestedSort = getSingleParam(params.sort);
  const sort = requestedSort === "name_asc" ? "name_asc" : "play_count_desc";
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in FORMAT_LABELS ? requestedFormat : "all";
  const origin = getSingleParam(params.origin) || "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const formatOptions = ["all", ...Object.keys(FORMAT_LABELS)];
  const originOptions = [
    "all",
    ...Array.from(new Set(allSeries.map((series) => String(series.originType ?? "").trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "ja")
    ),
  ];

  const formatFilteredSeries =
    format === "all" ? allSeries : allSeries.filter((series) => String(series.format ?? "") === format);

  const filteredSeries =
    origin === "all"
      ? formatFilteredSeries
      : formatFilteredSeries.filter((series) => String(series.originType ?? "").trim() === origin);

  const sortedSeries = [...filteredSeries].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name, "ja");
    return b.playCount - a.playCount || a.name.localeCompare(b.name, "ja");
  });

  const totalPages = Math.max(1, Math.ceil(sortedSeries.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visibleSeries = sortedSeries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container works-index-page series-index-page" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "シリーズ一覧" }]} />

        <section className="hero-card stack-md works-index-hero">
          <div className="stack-sm">
            <span className="eyebrow">Series</span>
            <h1 className="page-title">シリーズ一覧</h1>
            <p className="lead">
              世界観や原作ごとに、2.5次元舞台・ミュージカルのシリーズを一覧で探せます。
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">表示中 {filteredSeries.length}件</span>
            <span className="catalog-chip">全シリーズ {allSeries.length}件</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        {featuredSeries ? (
          <Link className="series-feature-card" href={`/series/${featuredSeries.slug}`}>
            <div className="series-feature-card__poster">
              <PlayPosterFrame
                title={featuredSeries.name}
                seed={`${featuredSeries.slug}-${featuredSeries.originType ?? ""}`}
              />
            </div>
            <div className="series-feature-card__body">
              <span className="series-feature-card__badge">注目のシリーズ</span>
              <div className="series-feature-card__title">{featuredSeries.name}</div>
              {featuredSeries.description ? (
                <p className="series-feature-card__text">
                  {truncate(toPlainText(featuredSeries.description), 120)}
                </p>
              ) : null}
              <div className="series-feature-card__facts">
                <span>作品数 {featuredSeries.playCount}作品</span>
                {featuredSeries.format ? <span>{FORMAT_LABELS[featuredSeries.format] ?? featuredSeries.format}</span> : null}
                {featuredSeries.originType ? <span>{featuredSeries.originType}</span> : null}
              </div>
              <div className="series-feature-card__tags">
                {getSeriesCardTags(featuredSeries).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <span className="series-feature-card__arrow" aria-hidden="true">
              ›
            </span>
          </Link>
        ) : null}

        <section className="section-card stack-md works-list-panel">
          <h2 className="section-title">シリーズ・フィルター</h2>

          <div className="filter-row filter-row--dense works-filter-row">
            <Link
              className={`filter-chip ${sort === "play_count_desc" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "play_count_desc", format, origin })}
            >
              作品数順
            </Link>
            <Link
              className={`filter-chip ${sort === "name_asc" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "name_asc", format, origin })}
            >
              名前順
            </Link>
          </div>

          <div className="filter-row filter-row--dense genre-filter-row works-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format: option, origin })}
              >
                {option === "all" ? "すべて" : FORMAT_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="filter-row filter-row--dense genre-filter-row works-filter-row">
            {originOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${origin === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format, origin: option })}
              >
                {option === "all" ? "すべて" : option}
              </Link>
            ))}
          </div>

          <div className="catalog-grid catalog-grid--play-list">
            {visibleSeries.map((series) => (
              <article className="catalog-card catalog-card--play-list" key={series.slug}>
                <Link className="play-list-card__poster-link" href={`/series/${series.slug}`} aria-label={series.name}>
                  <PlayPosterFrame title={series.name} seed={`${series.slug}-${series.originType ?? ""}`} />
                </Link>

                <div className="play-list-card__main">
                  <Link className="catalog-card__body-link" href={`/series/${series.slug}`}>
                    <div className="catalog-card__top catalog-card__top--stack">
                      <div className="catalog-card__title">{series.name}</div>
                    </div>

                    {series.description ? (
                      <div className="catalog-card__text play-list-card__summary">
                        {truncate(toPlainText(series.description), 140)}
                      </div>
                    ) : (
                      <div className="catalog-card__text play-list-card__summary">
                        シリーズ説明は現在整備中です。
                      </div>
                    )}

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
                        <span className="play-list-card__fact-key">作品数</span>
                        <span className="play-list-card__fact-value">{series.playCount}作品</span>
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
                          <span className="play-list-card__fact-key">上演形式</span>
                          <span className="play-list-card__fact-value">
                            {FORMAT_LABELS[series.format] ?? series.format}
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
                          <span className="play-list-card__fact-key">原作区分</span>
                          <span className="play-list-card__fact-value">{series.originType}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="play-list-card__tag-row">
                      {getSeriesCardTags(series).map((tag) => (
                        <span className="play-list-card__tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="catalog-card__footer play-list-card__footer">
                      <span className="catalog-link">シリーズ詳細を見る</span>
                      <span className="play-list-card__chevron" aria-hidden="true">
                        →
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
                href={buildHref({ page: Math.max(1, safePage - 1), sort, format, origin })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, format, origin })}
              >
                次へ
              </Link>
            </div>
          ) : null}

          <div className="works-index-cta">
            <div className="works-index-cta__icon" aria-hidden="true">
              □
            </div>
            <div className="works-index-cta__copy">
              <p className="works-index-cta__title">シリーズから関連作品をまとめて確認</p>
              <p className="works-index-cta__text">気になるシリーズの詳細から、作品一覧や配信状況まで横断できます。</p>
            </div>
            <Link className="works-index-cta__link" href="/plays">
              作品一覧へ
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
