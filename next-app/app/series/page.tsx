import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
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
  title: "シリーズ一覧 | Stage Connect（ステコネ）",
  description: "2.5次元舞台・ミュージカルのシリーズを、作品数・上演形式・原作種別ごとに一覧できます。",
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
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "繧ｷ繝ｪ繝ｼ繧ｺ荳隕ｧ", path: "/series" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "シリーズ一覧",
    description: "2.5次元舞台・ミュージカルのシリーズを、作品数・上演形式・原作種別ごとに一覧できます。",
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
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "繧ｷ繝ｪ繝ｼ繧ｺ荳隕ｧ" }]} />
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Series</span>
            <h1 className="page-title">シリーズ一覧</h1>
            <p className="lead">2.5次元舞台・ミュージカルのシリーズを、作品数や原作種別とあわせて一覧できます。</p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">表示中のシリーズ {filteredSeries.length}件</span>
            <span className="catalog-chip">登録シリーズ {allSeries.length}件</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">シリーズ・フランチャイズ</h2>

          <div className="filter-row filter-row--dense">
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

          <div className="filter-row filter-row--dense genre-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format: option, origin })}
              >
                {option === "all" ? "縺吶∋縺ｦ" : FORMAT_LABELS[option]}
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
                {option === "all" ? "縺吶∋縺ｦ" : option}
              </Link>
            ))}
          </div>

          <div className="catalog-grid">
            {visibleSeries.map((series) => (
              <article className="catalog-card" key={series.slug}>
                <Link className="catalog-card__body-link" href={`/series/${series.slug}`}>
                  <div className="catalog-card__top catalog-card__top--stack">
                    <div className="catalog-card__title">{series.name}</div>
                    <div className="catalog-card__top-actions">
                      {format === "all" && series.format ? (
                        <span className="catalog-card__badge">{FORMAT_LABELS[series.format] ?? series.format}</span>
                      ) : null}
                      <span className="catalog-card__badge">{series.playCount}菴懷刀</span>
                    </div>
                  </div>

                  {series.originType ? <div className="catalog-card__sub">{series.originType}</div> : null}

                  {series.description ? (
                    <div className="catalog-card__text">{truncate(toPlainText(series.description), 140)}</div>
                  ) : (
                    <div className="catalog-card__text">シリーズ説明は現在準備中です。</div>
                  )}

                  <div className="catalog-card__footer">
                    <span className="catalog-link">シリーズ詳細を見る</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.max(1, safePage - 1), sort, format, origin })}
              >
                蜑阪∈
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, format, origin })}
              >
                谺｡縺ｸ
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

