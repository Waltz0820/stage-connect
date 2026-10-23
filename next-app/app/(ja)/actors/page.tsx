import { DirectoryEmpty } from "../../../components/DirectoryEmpty";
import { DirectorySearchForm } from "../../../components/DirectorySearchForm";
import { DirectoryHero } from "../../../components/DirectoryHero";
import { matchesSearch, normalizeSearchQuery } from '../../../lib/search-query';
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { StructuredData } from "../../../components/StructuredData";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../../lib/structured-data";
import {
  getDisplayBirthday,
  getActorList,
  getAgeFromBirthday,
} from "../../../lib/stage-connect";

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

  const q = normalizeSearchQuery(getSingleParam(params.q));
  const matchingActors = allActors.filter(actor => matchesSearch([actor.name,actor.nameEn,actor.kana,actor.slug],q));
  const requestedGender = getSingleParam(params.gender);
  const gender = requestedGender in GENDER_LABELS ? requestedGender : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const filteredActors =
    gender === "all" ? matchingActors : matchingActors.filter((actor) => String(actor.gender ?? "") === gender);

  const totalPages = Math.max(1, Math.ceil(filteredActors.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visibleActors = filteredActors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container works-index-page editorial-directory directory--actors">
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "俳優一覧" }]} />
        <DirectoryHero kind="actors" title="俳優一覧" />

        <section className="section-card stack-md works-list-panel">
          <h2 className="section-title">俳優データベース</h2>

          <DirectorySearchForm className="v2-search" action="/actors">
            <label className="sr-only" htmlFor="actor-query">俳優名で検索</label>
            <input id="actor-query" name="q" defaultValue={q} placeholder="俳優名で検索（漢字・かな・ローマ字）"/>
            <input type="hidden" name="gender" value={gender}/><button type="submit" aria-label="検索">→</button>
          </DirectorySearchForm>
          {filteredActors.length === 0 ? <DirectoryEmpty locale="ja" kind="actors" /> : null}

          <div className="filter-row filter-row--dense works-filter-row">
            <Link className={`filter-chip ${gender === "all" ? "is-active" : ""}`} href={buildHref({ q, page: 1, gender: "all" })}>
              すべて
            </Link>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <Link
                key={value}
                className={`filter-chip ${gender === value ? "is-active" : ""}`}
                href={buildHref({ q, page: 1, gender: value })}
              >
                {label}
              </Link>
            ))}
          </div>

          <p className="catalog-count"><strong>{filteredActors.length.toLocaleString()}</strong>人の俳優</p>

          <div className="catalog-grid catalog-grid--actor-list">
            {visibleActors.map((actor) => {
              const birthday = getDisplayBirthday(actor.birthday, actor.birthdayLabel);
              const age = getAgeFromBirthday(actor.birthday, actor.deathDate);
              const initials = getActorInitials(actor);

              return (
                <article className="catalog-card catalog-card--actor-list" key={actor.slug}>
                  <Link className="actor-directory-link" href={`/actors/${actor.slug}`}>
                    <span className="actor-list-card__monogram" aria-hidden="true">{initials}</span>
                    <div className="actor-list-card__main">
                      <span className="catalog-card__title">{actor.name}</span>
                      {actor.kana ? <div className="actor-list-card__kana">{actor.kana}</div> : null}
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
                      </div>
                    </div>
                    <span className="directory-row-arrow" aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="pagination-row">
              <Link
                className={`pagination-link ${safePage === 1 ? "is-disabled" : ""}`}
                aria-disabled={safePage === 1 || undefined} tabIndex={safePage === 1 ? -1 : undefined}
                href={buildHref({ q, page: Math.max(1, safePage - 1), gender })}
              >
                前へ
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                aria-disabled={safePage === totalPages || undefined} tabIndex={safePage === totalPages ? -1 : undefined}
                href={buildHref({ q, page: Math.min(totalPages, safePage + 1), gender })}
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
              <p className="works-index-cta__text">作品やシリーズから出演キャストを探せます。</p>
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
