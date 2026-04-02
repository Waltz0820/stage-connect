import type { Metadata } from "next";
import Link from "next/link";
import { getPlayList, periodSortKey, toPlainText, truncate } from "../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 10;
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
    "2.5次元舞台・ミュージカル作品を一覧で整理。シリーズ、あらすじ、公演情報を見ながら、気になる作品詳細へそのまま進めます。",
};

export default async function PlaysPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allPlays = await getPlayList();

  const sort = getSingleParam(params.sort) === "old" ? "old" : "new";
  const requestedGenre = getSingleParam(params.genre);
  const genre = requestedGenre && requestedGenre in GENRE_LABELS ? requestedGenre : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const genreOptions = ["all", ...Object.keys(GENRE_LABELS)];

  const filteredPlays =
    genre === "all" ? allPlays : allPlays.filter((play) => String(play.genre ?? "") === genre);

  const sortedPlays = [...filteredPlays].sort((a, b) => {
    if (sort === "old") {
      return periodSortKey(a.period) - periodSortKey(b.period);
    }
    return periodSortKey(b.period) - periodSortKey(a.period);
  });

  const totalPages = Math.max(1, Math.ceil(sortedPlays.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visiblePlays = sortedPlays.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Plays</span>
            <h1 className="page-title">作品一覧</h1>
            <p className="lead">
              2.5次元舞台・ミュージカル作品を、シリーズ・公演時期・ジャンルとあわせて一覧で確認できます。
              データベースの導線として、気になる作品詳細へそのまま進める入口です。
            </p>
          </div>

          <div className="catalog-summary">
            <span className="catalog-chip">該当作品 {filteredPlays.length}件</span>
            <span className="catalog-chip">全掲載作品 {allPlays.length}件</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">作品データベース</h2>
            <p className="catalog-note">
              ジャンルや並び順を切り替えながら、シリーズ・あらすじ・公演情報を一覧で確認できます。
            </p>
          </div>

          <div className="filter-row">
            <Link
              className={`filter-chip ${sort === "new" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "new", genre })}
            >
              新しい順
            </Link>
            <Link
              className={`filter-chip ${sort === "old" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "old", genre })}
            >
              古い順
            </Link>
          </div>

          <div className="filter-row">
            {genreOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${genre === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, genre: option })}
              >
                {option === "all" ? "すべて" : GENRE_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="catalog-grid">
            {visiblePlays.map((play) => (
              <article className="catalog-card" key={play.slug}>
                <div className="catalog-card__top">
                  <Link className="catalog-card__title" href={`/plays/${play.slug}`}>
                    {play.title}
                  </Link>
                  {play.franchiseName ? <span className="catalog-card__badge">シリーズ</span> : null}
                </div>

                {play.franchiseName ? <div className="catalog-card__sub">{play.franchiseName}</div> : null}
                {play.period ? <div className="catalog-card__sub mono">{play.period}</div> : null}
                {play.genre ? (
                  <div className="catalog-card__sub">{GENRE_LABELS[play.genre] ?? play.genre}</div>
                ) : null}

                {play.summary ? (
                  <div className="catalog-card__text">{truncate(toPlainText(play.summary), 140)}</div>
                ) : (
                  <div className="catalog-card__text">作品概要は現在準備中です。</div>
                )}

                <div className="catalog-card__footer">
                  <Link className="catalog-link" href={`/plays/${play.slug}`}>
                    作品詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.max(1, safePage - 1), sort, genre })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, genre })}
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
