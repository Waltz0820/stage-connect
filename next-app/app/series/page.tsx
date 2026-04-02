import type { Metadata } from "next";
import Link from "next/link";
import { getSeriesList, toPlainText, truncate } from "../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 10;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

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
  title: "シリーズ一覧 | Stage Connect",
  description:
    "2.5次元舞台・ミュージカルのシリーズやフランチャイズを一覧で整理。配下作品、出演キャスト、年表への入口として確認できます。",
};

metadata.alternates = {
  canonical: `${siteUrl}/series`,
};

export default async function SeriesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allSeries = await getSeriesList();

  const requestedSort = getSingleParam(params.sort);
  const sort = requestedSort === "name_asc" ? "name_asc" : "play_count_desc";
  const origin = getSingleParam(params.origin) || "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const originOptions = [
    "all",
    ...Array.from(new Set(allSeries.map((series) => String(series.originType ?? "").trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "ja")
    ),
  ];

  const filteredSeries =
    origin === "all"
      ? allSeries
      : allSeries.filter((series) => String(series.originType ?? "").trim() === origin);

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
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Series</span>
            <h1 className="page-title">シリーズ一覧</h1>
            <p className="lead">
              テニミュのシーズン区切りや、刀剣乱舞のようなシリーズ単位で作品群を整理しています。
              配下作品や出演キャスト、年表の入口として使える一覧です。
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">該当シリーズ {filteredSeries.length}件</span>
            <span className="catalog-chip">全掲載シリーズ {allSeries.length}件</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">シリーズ・フランチャイズ</h2>
            <p className="catalog-note">
              原作種別や作品数の多い順を切り替えながら、関連作品のまとまりを一覧で確認できます。
            </p>
          </div>

          <div className="filter-row filter-row--dense">
            <Link
              className={`filter-chip ${sort === "play_count_desc" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "play_count_desc", origin })}
            >
              作品数順
            </Link>
            <Link
              className={`filter-chip ${sort === "name_asc" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "name_asc", origin })}
            >
              名前順
            </Link>
          </div>

          <div className="filter-row filter-row--dense genre-filter-row">
            {originOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${origin === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, origin: option })}
              >
                {option === "all" ? "すべて" : option}
              </Link>
            ))}
          </div>

          <div className="catalog-grid">
            {visibleSeries.map((series) => (
              <article className="catalog-card" key={series.slug}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={`/series/${series.slug}`}>
                    {series.name}
                  </Link>
                  <span className="catalog-card__badge">{series.playCount}作品</span>
                </div>

                {series.originType ? <div className="catalog-card__sub">{series.originType}</div> : null}

                {series.description ? (
                  <div className="catalog-card__text">{truncate(toPlainText(series.description), 140)}</div>
                ) : (
                  <div className="catalog-card__text">シリーズ説明は現在準備中です。</div>
                )}

                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={`/series/${series.slug}`}>
                    シリーズ詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.max(1, safePage - 1), sort, origin })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, origin })}
              >
                次へ
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
