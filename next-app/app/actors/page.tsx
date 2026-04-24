import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../components/FavoriteButtonClient";
import { StructuredData } from "../../components/StructuredData";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../lib/structured-data";
import {
  getDisplayBirthday,
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

const getActorInitials = (actor: { slug: string; name: string }) => {
  const slugParts = actor.slug
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (slugParts.length > 0) {
    return slugParts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  return actor.name.trim().slice(0, 1) || "S";
};

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
  title: "俳優一覧 | Stage Connect（ステコネ）",
  description: "2.5次元舞台・ミュージカルに出演する俳優を、プロフィールや出演履歴とあわせて一覧できます。",
  alternates: {
    canonical: `${siteUrl}/actors`,
    languages: {
      ja: `${siteUrl}/actors`,
      en: `${siteUrl}/en/actors`,
    },
  },
};

export default async function ActorsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allActors = await getActorList();
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "TOP", path: "/" },
    { name: "俳優一覧", path: "/actors" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "俳優一覧",
    description: "2.5次元舞台・ミュージカルに出演する俳優を、プロフィールや出演履歴とあわせて一覧できます。",
    path: "/actors",
  });

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
    <main className="container works-index-page" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "俳優一覧" }]} />
        <section className="hero-card stack-md works-index-hero">
          <div className="stack-sm">
            <span className="eyebrow">Actors</span>
            <h1 className="page-title">俳優一覧</h1>
            <p className="lead">
              2.5次元舞台・ミュージカルに出演する俳優を、プロフィールや出演履歴とあわせて一覧できます。
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">表示中の俳優 {filteredActors.length}人</span>
            <span className="catalog-chip">登録俳優 {allActors.length}人</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md works-list-panel">
          <h2 className="section-title">俳優データベース</h2>

          <div className="filter-row filter-row--dense works-filter-row">
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

          <div className="catalog-grid catalog-grid--actor-list">
            {visibleActors.map((actor) => {
              const birthday = getDisplayBirthday(actor.birthday, actor.birthdayLabel);
              const age = getAgeFromBirthday(actor.birthday, actor.deathDate);
              const initials = getActorInitials(actor);

              return (
                <article className="catalog-card catalog-card--actor-list" key={actor.slug}>
                  <Link className="actor-list-card__monogram-link" href={`/actors/${actor.slug}`} aria-label={`${actor.name}の詳細を見る`}>
                    <span className="actor-list-card__monogram">{initials}</span>
                  </Link>

                  <div className="actor-list-card__main">
                    <div className="catalog-card__top actor-list-card__top">
                      <div>
                        <div className="catalog-card__title">{actor.name}</div>
                        {actor.kana ? <div className="actor-list-card__kana">{actor.kana}</div> : null}
                      </div>
                      <FavoriteButtonClient
                        slug={actor.slug}
                        type="actor"
                        size="sm"
                        name={actor.name}
                        kana={actor.kana}
                      />
                    </div>

                    <Link className="catalog-card__body-link actor-list-card__body" href={`/actors/${actor.slug}`}>
                      <div className="actor-list-card__facts">
                        {birthday ? (
                          <span className="actor-list-card__fact">
                            {birthday}
                            {age !== null ? ` (${age}歳)` : ""}
                          </span>
                        ) : null}
                        {actor.gender && actor.gender in GENDER_LABELS ? (
                          <span className="actor-list-card__fact">{GENDER_LABELS[actor.gender]}</span>
                        ) : null}
                        {birthday ? <span className="actor-list-card__fact">プロフィールあり</span> : null}
                      </div>

                      {actor.profile ? (
                        <div className="catalog-card__text actor-list-card__summary">{truncate(toPlainText(actor.profile), 140)}</div>
                      ) : (
                        <div className="catalog-card__text actor-list-card__summary">プロフィールは現在準備中です。</div>
                      )}

                      <div className="catalog-card__footer actor-list-card__footer">
                        <span className="catalog-link">俳優詳細を見る</span>
                        <span className="play-list-card__chevron">›</span>
                      </div>
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

          <div className="works-index-cta">
            <div className="works-index-cta__icon" aria-hidden="true">
              ◌
            </div>
            <div className="works-index-cta__copy">
              <p className="works-index-cta__title">出演作・シリーズからも探す</p>
              <p className="works-index-cta__text">作品やシリーズを起点に、出演キャストや関連情報を横断できます。</p>
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
