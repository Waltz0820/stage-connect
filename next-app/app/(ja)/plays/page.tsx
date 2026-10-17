import { matchesSearch, normalizeSearchQuery } from '../../../lib/search-query';
import PlayDiscoveryForm from "../../../components/PlayDiscoveryForm";
import { isOshiPoint } from "../../../lib/oshi-points.mjs";
import { getOshiDiscovery } from "../../../lib/oshi-server";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { ProductionMark } from "../../../components/ProductionMark";
import { StructuredData } from "../../../components/StructuredData";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../../lib/structured-data";
import { getPlayList, getPlayMainCastSummariesBySlug, periodSortKey, toPlainText, truncate } from "../../../lib/stage-connect";

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

const getPlayReleaseLabel = (period?: string | null) => {
  if (!period) return null;

  const slashDate = period.match(/(\d{4})\/(\d{1,2})/);
  if (slashDate) {
    const [, year, month] = slashDate;
    return `${year}年${Number(month)}月`;
  }

  const jpDate = period.match(/(\d{4})年\s*(\d{1,2})月/);
  if (jpDate) {
    const [, year, month] = jpDate;
    return `${year}年${Number(month)}月`;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}年${Number(month)}月`;
  }

  const yearOnly = period.match(/(\d{4})/);
  return yearOnly ? `${yearOnly[1]}年` : null;
};

const getPlayAvailabilityLabel = (vod?: Record<string, string> | null) => {
  if (vod?.dmm) return "DMM TVリンクあり";
  if (vod && Object.keys(vod).length > 0) return "配信リンクあり";
  return "配信情報なし";
};

const getPlayCardTags = (play: {
  franchiseFormat: string | null;
  genre: string | null;
  franchiseName: string | null;
  vod: Record<string, string> | null;
}) => {
  const tags = [
    play.vod?.dmm ? "配信あり" : null,
    play.franchiseFormat ? FORMAT_LABELS[play.franchiseFormat] ?? play.franchiseFormat : null,
    play.genre ? GENRE_LABELS[play.genre] ?? play.genre : null,
    play.franchiseName ? "シリーズ作品" : null,
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
  return query ? `/plays?${query}` : "/plays";
};

export const metadata: Metadata = {
  title: "作品一覧 | Stage Connect",
  description:
    "2.5次元舞台・ミュージカル作品を、出演時期・上演形式・ジャンル別に一覧で確認できます。",
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
      "2.5次元舞台・ミュージカル作品を、出演時期・上演形式・ジャンル別に一覧で確認できます。",
    path: "/plays",
  });

  const requestedSort = getSingleParam(params.sort);
  const sort = ["old", "support"].includes(requestedSort) ? requestedSort : "new";
  const q = getSingleParam(params.q).trim().slice(0, 200);
  const point = isOshiPoint(getSingleParam(params.point)) ? getSingleParam(params.point) : "";
  const series = getSingleParam(params.series);
  const streaming = getSingleParam(params.streaming) === "available" ? "available" : "";
  const discovery = point ? await getOshiDiscovery(point) : { available: false, rows: [] };
  const supportBySlug = new Map(discovery.rows.map((row) => [row.play_slug, row]));
  const seriesOptions = Array.from(new Set(allPlays.map((play) => play.franchiseName).filter(Boolean))).map((name) => ({ value: name!, label: name! })).sort((a,b) => a.label.localeCompare(b.label, "ja"));
  const discoveryMatches = (play: (typeof allPlays)[number]) => {
    return (matchesSearch([play.title, play.titleEn, play.franchiseName, play.franchiseNameEn, play.slug],q))
      && (!series || play.franchiseName === series)
      && (!streaming || Boolean(play.vod && Object.keys(play.vod).some((key) => play.vod?.[key])))
      && (!point || !discovery.available || supportBySlug.has(play.slug));
  };
  const pageHref = (changes: Record<string, string | number>) => buildHref({ q, point, series, streaming, sort, format, genre, ...changes });
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in FORMAT_LABELS ? requestedFormat : "all";
  const requestedGenre = getSingleParam(params.genre);
  const genre = requestedGenre && requestedGenre in GENRE_LABELS ? requestedGenre : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;


  const formatFilteredPlays =
    format === "all" ? allPlays : allPlays.filter((play) => String(play.franchiseFormat ?? "") === format);
  const objectiveFilteredPlays =
    genre === "all" ? formatFilteredPlays : formatFilteredPlays.filter((play) => String(play.genre ?? "") === genre);

  const filteredPlays = objectiveFilteredPlays.filter(discoveryMatches);

  const sortedPlays = [...filteredPlays].sort((a, b) => {
    if (sort === "support" && point && discovery.available) {
      const aScore = supportBySlug.get(a.slug); const bScore = supportBySlug.get(b.slug);
      const diff = (bScore ? Number(bScore.votes) / Number(bScore.participants) : 0) - (aScore ? Number(aScore.votes) / Number(aScore.participants) : 0);
      if (diff) return diff;
      const votersDiff = Number(bScore?.participants ?? 0) - Number(aScore?.participants ?? 0);
      if (votersDiff) return votersDiff;
    }
    if (sort === "old") return periodSortKey(a.period) - periodSortKey(b.period);
    return periodSortKey(b.period) - periodSortKey(a.period);
  });

  const totalPages = Math.max(1, Math.ceil(sortedPlays.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visiblePlays = sortedPlays.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const visibleCastSummaries = await getPlayMainCastSummariesBySlug(visiblePlays.map((play) => play.slug));

  return (
    <main className="container works-index-page" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "作品一覧" }]} />
        <section className="hero-card stack-md works-index-hero">
          <div className="stack-sm">
            <span className="eyebrow">Plays</span>
            <h1 className="page-title">作品一覧</h1>
            <p className="lead">
              作品・キャスト・配信情報を探す
            </p>
          </div>

        </section>

        <section className="section-card stack-md works-list-panel">
          <PlayDiscoveryForm locale="ja" values={{ q, point, series, streaming, sort, format, genre }} formats={FORMAT_LABELS} genres={GENRE_LABELS} seriesOptions={seriesOptions} pointAvailable={discovery.available} />
          {filteredPlays.length === 0 ? <p className="catalog-note">この条件に合う作品はまだありません。条件を変えるか、作品ページで推しポイントを教えてね。</p> : null}

          <p className="catalog-count"><strong>{filteredPlays.length.toLocaleString()}</strong>件の作品</p>

          <div className="catalog-grid catalog-grid--play-list">
            {visiblePlays.map((play) => (
              <article className="catalog-card catalog-card--play-list" key={play.slug}>
                <Link className="play-list-card__mark-link" href={`/plays/${play.slug}`} aria-label={play.title}>
                  <ProductionMark seriesSlug={play.slug} format={play.franchiseFormat}/>
                </Link>

                <div className="play-list-card__main">
                  <div className="catalog-card__top catalog-card__top--stack">
                    <Link className="catalog-card__title" href={`/plays/${play.slug}`}>{play.title}</Link>
                  </div>

                  <Link className="catalog-card__body-link" href={`/plays/${play.slug}`}>
                    {play.franchiseName ? (
                      <div className="catalog-card__sub play-list-card__series">{play.franchiseName}</div>
                    ) : null}

                    {play.summary ? (
                      <div className="catalog-card__text play-list-card__summary">
                        {truncate(toPlainText(play.summary), 140)}
                      </div>
                    ) : (
                      <div className="catalog-card__text play-list-card__summary">作品説明は現在準備中です。</div>
                    )}

                    <div className="play-list-card__facts">
                      {getPlayReleaseLabel(play.period) ? (
                        <div className="play-list-card__fact">
                          <span className="play-list-card__fact-icon" aria-hidden="true">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                              <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
                              <path d="M5 2.5v2M11 2.5v2M2.5 6.5h11" />
                            </svg>
                          </span>
                          <span className="play-list-card__fact-key">公開年月</span>
                          <span className="play-list-card__fact-value">{getPlayReleaseLabel(play.period)}</span>
                        </div>
                      ) : null}
                      <div className="play-list-card__fact">
                        <span className="play-list-card__fact-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <circle cx="8" cy="5" r="2.5" />
                            <path d="M3.5 13c.5-2.6 2.5-4 4.5-4s4 1.4 4.5 4" />
                          </svg>
                        </span>
                        <span className="play-list-card__fact-key">主要キャスト</span>
                        <span className="play-list-card__fact-value">
                          {visibleCastSummaries[play.slug]?.ja || play.mainCastSummary || "未登録"}
                        </span>
                      </div>
                      <div className="play-list-card__fact">
                        <span className="play-list-card__fact-icon" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="2.5" y="3.5" width="11" height="9" rx="2" />
                            <path d="M7 6.4 10 8 7 9.6Z" fill="currentColor" stroke="none" />
                          </svg>
                        </span>
                        <span className="play-list-card__fact-key">配信有無</span>
                        <span className="play-list-card__fact-value">{getPlayAvailabilityLabel(play.vod)}</span>
                      </div>
                    </div>

                    {point && supportBySlug.has(play.slug) ? <p className="point-support">{"支持率 "}{Math.round(Number(supportBySlug.get(play.slug)!.votes) / Number(supportBySlug.get(play.slug)!.participants) * 100)}% · {supportBySlug.get(play.slug)!.participants}人が参加</p> : null}
                    <div className="play-list-card__tag-row">
                      {getPlayCardTags(play).map((tag) => (
                        <span className="play-list-card__tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="catalog-card__footer play-list-card__footer">
                      <span className="catalog-link">作品詳細を見る</span>
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
                href={pageHref({ page: Math.max(1, safePage - 1) })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={pageHref({ page: Math.min(totalPages, safePage + 1) })}
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
              <p className="works-index-cta__title">シリーズから作品を探す</p>
              <p className="works-index-cta__text">人気シリーズや関連作品をまとめてチェックできます。</p>
            </div>
            <Link className="works-index-cta__link" href="/series">
              シリーズ一覧へ
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
