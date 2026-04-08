import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../components/FavoriteButtonClient";
import { StructuredData } from "../../components/StructuredData";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../lib/structured-data";
import { getPlayList, periodSortKey, toPlainText, truncate } from "../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 10;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const FORMAT_LABELS: Record<string, string> = {
  stage: "舞台",
  musical: "ミュージカル",
};

const GENRE_LABELS: Record<string, string> = {
  history: "歴史・時代劇",
  fantasy: "ファンタジー",
  battle_shonen: "バトル・アクション",
  sports: "スポーツ",
  idol: "アイドル",
  music_stage: "音楽・ライブ",
  mystery_suspense: "ミステリー",
  horror: "ホラー",
  comedy: "コメディ",
  otome_female: "乙女・女性向け",
  other: "その他",
};

const compactListPeriod = (period?: string | null) => {
  if (!period) return null;

  const slashDate = period.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashDate) {
    const [, year, month, day] = slashDate;
    return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}-`;
  }

  const jpDate = period.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (jpDate) {
    const [, year, month, day] = jpDate;
    return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}-`;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) {
    return `${yearOnly[1]}-`;
  }

  return period;
};

const getSingleParam = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value) ?? "";

const buildHref = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/plays?${query}` : "/plays";
};

export const metadata: Metadata = {
  title: "作品一覧 | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）で、2.5次元舞台・ミュージカル作品を一覧できます。舞台・ミュージカルやジャンル別に絞り込み、気になる作品詳細へそのまま移動できます。",
  alternates: {
    canonical: `${siteUrl}/plays`,
    languages: {
      ja: `${siteUrl}/plays`,
      en: `${siteUrl}/en/plays`,
    },
  },
};

export default async function PlaysPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allPlays = await getPlayList();
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "作品一覧", path: "/plays" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "作品一覧",
    description:
      "2.5次元舞台・ミュージカル作品を、公演順・上演形式・ジャンル別に一覧できるページです。",
    path: "/plays",
  });

  const sort = getSingleParam(params.sort) === "old" ? "old" : "new";
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in FORMAT_LABELS ? requestedFormat : "all";
  const requestedGenre = getSingleParam(params.genre);
  const genre = requestedGenre && requestedGenre in GENRE_LABELS ? requestedGenre : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const formatOptions = ["all", ...Object.keys(FORMAT_LABELS)];
  const genreOptions = ["all", ...Object.keys(GENRE_LABELS)];

  const formatFilteredPlays =
    format === "all" ? allPlays : allPlays.filter((play) => String(play.franchiseFormat ?? "") === format);

  const filteredPlays =
    genre === "all" ? formatFilteredPlays : formatFilteredPlays.filter((play) => String(play.genre ?? "") === genre);

  const sortedPlays = [...filteredPlays].sort((a, b) => {
    if (sort === "old") return periodSortKey(a.period) - periodSortKey(b.period);
    return periodSortKey(b.period) - periodSortKey(a.period);
  });

  const totalPages = Math.max(1, Math.ceil(sortedPlays.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visiblePlays = sortedPlays.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "作品一覧" }]} />
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Plays</span>
            <h1 className="page-title">作品一覧</h1>
            <p className="lead">2.5次元舞台・ミュージカル作品を、上演形式やジャンル別に一覧できます。</p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">表示中 {filteredPlays.length}件</span>
            <span className="catalog-chip">全作品 {allPlays.length}件</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">作品データベース</h2>

          <div className="filter-row filter-row--dense">
            <Link
              className={`filter-chip ${sort === "new" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "new", format, genre })}
            >
              新しい順
            </Link>
            <Link
              className={`filter-chip ${sort === "old" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "old", format, genre })}
            >
              古い順
            </Link>
          </div>

          <div className="filter-row filter-row--dense genre-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format: option, genre })}
              >
                {option === "all" ? "すべて" : FORMAT_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="filter-row filter-row--dense genre-filter-row">
            {genreOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${genre === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format, genre: option })}
              >
                {option === "all" ? "すべて" : GENRE_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="catalog-grid">
            {visiblePlays.map((play) => (
              <article className="catalog-card" key={play.slug}>
                <div className="catalog-card__top catalog-card__top--stack">
                  <div className="catalog-card__top-title-row">
                    <div className="catalog-card__title">{play.title}</div>
                    <FavoriteButtonClient
                      slug={play.slug}
                      type="play"
                      size="sm"
                      title={play.title}
                      franchiseName={play.franchiseName}
                    />
                  </div>

                  {(format === "all" && play.franchiseFormat) || play.franchiseName ? (
                    <div className="catalog-card__top-actions">
                      {format === "all" && play.franchiseFormat ? (
                        <span className="catalog-card__badge">
                          {FORMAT_LABELS[play.franchiseFormat] ?? play.franchiseFormat}
                        </span>
                      ) : null}
                      {play.franchiseName ? <span className="catalog-card__badge">シリーズ</span> : null}
                    </div>
                  ) : null}
                </div>

                <Link className="catalog-card__body-link" href={`/plays/${play.slug}`}>
                  {play.franchiseName ? <div className="catalog-card__sub">{play.franchiseName}</div> : null}
                {compactListPeriod(play.period) ? (
                  <div className="catalog-card__sub">
                    日程: <span className="mono">{compactListPeriod(play.period)}</span>
                  </div>
                ) : null}
                {play.genre ? (
                  <div className="catalog-card__sub">
                    ジャンル: {GENRE_LABELS[play.genre] ?? play.genre}
                  </div>
                ) : null}

                  {play.summary ? (
                    <div className="catalog-card__text">{truncate(toPlainText(play.summary), 140)}</div>
                  ) : (
                    <div className="catalog-card__text">作品情報は現在整理中です。</div>
                  )}

                  <div className="catalog-card__footer">
                    <span className="catalog-link">作品詳細を見る</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.max(1, safePage - 1), sort, format, genre })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, format, genre })}
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
