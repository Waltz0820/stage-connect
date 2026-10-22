import { DirectorySearchForm } from "../../../components/DirectorySearchForm";
import { DirectoryHero } from "../../../components/DirectoryHero";
import { matchesSearch, normalizeSearchQuery } from '../../../lib/search-query';
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../../components/FavoriteButtonClient";
import { StructuredData } from "../../../components/StructuredData";
import { getActorList, getAgeFromBirthday } from "../../../lib/stage-connect";
import { formatAgeEn, formatBirthdayEn, formatBirthdayLabelEn, getEnglishActorName } from "../../../lib/en-copy";
import { buildBreadcrumbList, buildCollectionPageStructuredData } from "../../../lib/structured-data";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 12;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

const getSingleParam = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value) ?? "";

const getActorInitials = (actor: { slug: string }, displayName: string) => {
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

  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  return displayName.trim().slice(0, 2).toUpperCase() || "SC";
};

const buildHref = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/en/actors?${query}` : "/en/actors";
};

export const metadata: Metadata = {
  title: "2.5D Cast | Stage Connect",
  description:
    "Browse 2.5D stage actors, profiles, and appearance history on Stage Connect.",
  alternates: {
    canonical: `${siteUrl}/en/actors`,
    languages: {
      ja: `${siteUrl}/actors`,
      en: `${siteUrl}/en/actors`,
    },
  },
};

export default async function EnglishActorsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allActors = await getActorList();
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Actors", path: "/en/actors" },
  ]);
  const collectionJsonLd = buildCollectionPageStructuredData({
    name: "2.5D Cast",
    description:
      "Browse actors, profiles, and stage appearance history connected to 2.5D productions.",
    path: "/en/actors",
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
        <Breadcrumbs items={[{ label: "Actors", href: "/en/actors" }]} />

        <DirectoryHero kind="actors" title="2.5D Cast" description="Browse actors, profiles, and stage appearance history connected to 2.5D productions." count={filteredActors.length} unit="actors" />

        <section className="section-card stack-md works-list-panel">
          <h2 className="section-title">Filters</h2>

          <DirectorySearchForm className="v2-search" action="/en/actors">
            <label className="sr-only" htmlFor="actor-query">Search actors</label>
            <input id="actor-query" name="q" defaultValue={q} placeholder="Search by actor name"/>
            <input type="hidden" name="gender" value={gender}/><button type="submit" aria-label="Search">→</button>
          </DirectorySearchForm>
          {filteredActors.length === 0 ? <p className="muted">No actors matched your search.</p> : null}

          <div className="filter-row filter-row--dense works-filter-row">
            <Link className={`filter-chip ${gender === "all" ? "is-active" : ""}`} href={buildHref({ q, page: 1, gender: "all" })}>
              All
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

          <p className="catalog-count"><strong>{filteredActors.length.toLocaleString()}</strong> actors</p>

          <div className="catalog-grid catalog-grid--actor-list">
            {visibleActors.map((actor) => {
              const displayName = getEnglishActorName(actor);
              const birthday = actor.birthdayLabel
                ? formatBirthdayLabelEn(actor.birthdayLabel)
                : formatBirthdayEn(actor.birthday);
              const age = getAgeFromBirthday(actor.birthday, actor.deathDate);
              const ageLabel = formatAgeEn(age);
              const initials = getActorInitials(actor, displayName);

              return (
                <article className="catalog-card catalog-card--actor-list" key={actor.slug}>
                  <Link className="actor-list-card__monogram-link" href={`/en/actors/${actor.slug}`} aria-label={`View ${displayName}`}>
                    <span className="actor-list-card__monogram">{initials}</span>
                  </Link>

                  <div className="actor-list-card__main">
                    <div className="catalog-card__top actor-list-card__top">
                      <div>
                        <Link className="catalog-card__title" href={`/en/actors/${actor.slug}`}>{displayName}</Link>
                        {actor.kana ? <div className="actor-list-card__kana">{actor.kana}</div> : null}
                      </div>
                      <FavoriteButtonClient slug={actor.slug} type="actor" size="sm" name={displayName} kana={actor.kana} />
                    </div>

                    <Link className="catalog-card__body-link actor-list-card__body" href={`/en/actors/${actor.slug}`}>
                      <div className="actor-list-card__facts">
                        {birthday ? (
                          <span className="actor-list-card__fact">
                            DOB: {birthday}
                            {ageLabel ? ` / ${ageLabel}` : ""}
                          </span>
                        ) : null}
                        {actor.gender && actor.gender in GENDER_LABELS ? (
                          <span className="actor-list-card__fact">{GENDER_LABELS[actor.gender]}</span>
                        ) : null}
                      </div>

                      <div className="catalog-card__footer actor-list-card__footer">
                        <span className="catalog-link">View actor details</span>
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
                href={buildHref({ q, page: Math.max(1, safePage - 1), gender })}
              >
                Previous
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ q, page: Math.min(totalPages, safePage + 1), gender })}
              >
                Next
              </Link>
            </div>
          ) : null}

          <div className="works-index-cta">
            <div className="works-index-cta__icon" aria-hidden="true">
              ◌
            </div>
            <div className="works-index-cta__copy">
              <p className="works-index-cta__title">Browse from plays and series</p>
              <p className="works-index-cta__text">Start from a production or franchise line to discover cast connections.</p>
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
