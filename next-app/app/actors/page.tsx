import type { Metadata } from "next";
import Link from "next/link";
import { FavoriteButtonClient } from "../../components/FavoriteButtonClient";
import {
  formatBirthday,
  getActorList,
  getAgeFromBirthday,
  toPlainText,
  truncate,
} from "../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 10;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
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
  return query ? `/actors?${query}` : "/actors";
};

export const metadata: Metadata = {
  title: "俳優一覧 | Stage Connect",
  description:
    "2.5次元舞台・ミュージカルに出演する俳優を一覧で整理。プロフィール、出演作品年表、共演ネットワークへの入口として使えます。",
};

metadata.alternates = {
  canonical: `${siteUrl}/actors`,
};

export default async function ActorsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allActors = await getActorList();

  const requestedGender = getSingleParam(params.gender);
  const gender = requestedGender in GENDER_LABELS ? requestedGender : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const filteredActors =
    gender === "all" ? allActors : allActors.filter((actor) => String(actor.gender ?? "") === gender);

  const totalPages = Math.max(1, Math.ceil(filteredActors.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visibleActors = filteredActors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Actors</span>
            <h1 className="page-title">俳優一覧</h1>
            <p className="lead">
              2.5次元舞台・ミュージカルに出演する俳優を、プロフィールや出演作品とあわせて一覧できます。
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">該当俳優 {filteredActors.length}人</span>
            <span className="catalog-chip">全掲載俳優 {allActors.length}人</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <div className="stack-sm">
            <h2 className="section-title">俳優データベース</h2>
            <p className="catalog-note">
              性別フィルタを切り替えながら、プロフィールと出演作品年表の入口を一覧で確認できます。
            </p>
          </div>

          <div className="filter-row filter-row--dense">
            <Link className={`filter-chip ${gender === "all" ? "is-active" : ""}`} href={buildHref({ page: 1, gender: "all" })}>
              すべて
            </Link>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <Link
                key={value}
                className={`filter-chip ${gender === value ? "is-active" : ""}`}
                href={buildHref({ page: 1, gender: value })}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="catalog-grid">
            {visibleActors.map((actor) => {
              const birthday = formatBirthday(actor.birthday);
              const age = getAgeFromBirthday(actor.birthday);

              return (
                <article className="catalog-card" key={actor.slug}>
                  <div className="catalog-card__top">
                    <Link className="catalog-card__title" href={`/actors/${actor.slug}`}>
                      {actor.name}
                    </Link>
                    <div className="catalog-card__top-actions">
                      {birthday ? <span className="catalog-card__badge">Profile</span> : null}
                      <FavoriteButtonClient slug={actor.slug} type="actor" size="sm" />
                    </div>
                  </div>

                  {actor.kana ? <div className="catalog-card__sub">{actor.kana}</div> : null}
                  {birthday ? (
                    <div className="catalog-card__sub">
                      {birthday}
                      {age !== null ? ` (${age}歳)` : ""}
                    </div>
                  ) : null}
                  {actor.gender && actor.gender in GENDER_LABELS ? (
                    <div className="catalog-card__sub">{GENDER_LABELS[actor.gender]}</div>
                  ) : null}

                  {actor.profile ? (
                    <div className="catalog-card__text">{truncate(toPlainText(actor.profile), 140)}</div>
                  ) : (
                    <div className="catalog-card__text">プロフィールは現在準備中です。</div>
                  )}

                  <div className="catalog-card__footer">
                    <Link className="catalog-link" href={`/actors/${actor.slug}`}>
                      俳優詳細を見る
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.max(1, safePage - 1), gender })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), gender })}
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
