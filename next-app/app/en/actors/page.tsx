import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../../components/FavoriteButtonClient";
import {
  formatBirthday,
  getActorList,
  getAgeFromBirthday,
  toPlainText,
} from "../../../lib/stage-connect";
import { truncateText } from "../../../lib/en-copy";

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
        <Breadcrumbs items={[{ label: "Actors", href: "/en/actors" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Actors</span>
            <h1 className="page-title">2.5D Cast</h1>
            <p className="lead">
              Browse actors, profiles, and stage appearance history connected to 2.5D productions.
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">Showing {filteredActors.length}</span>
            <span className="catalog-chip">All actors {allActors.length}</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Filters</h2>

          <div className="filter-row filter-row--dense">
            <Link className={`filter-chip ${gender === "all" ? "is-active" : ""}`} href={buildHref({ page: 1, gender: "all" })}>
              All
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
                    <div className="catalog-card__title">{actor.name}</div>
                    <div className="catalog-card__top-actions">
                      {birthday ? <span className="catalog-card__badge">Profile</span> : null}
                      <FavoriteButtonClient slug={actor.slug} type="actor" size="sm" name={actor.name} kana={actor.kana} />
                    </div>
                  </div>

                  <Link className="catalog-card__body-link" href={`/en/actors/${actor.slug}`}>
                    {actor.kana ? <div className="catalog-card__sub">{actor.kana}</div> : null}
                    {birthday ? (
                      <div className="catalog-card__sub">
                        Born {birthday}
                        {age !== null ? ` (${age})` : ""}
                      </div>
                    ) : null}
                    {actor.gender && actor.gender in GENDER_LABELS ? (
                      <div className="catalog-card__sub">{GENDER_LABELS[actor.gender]}</div>
                    ) : null}

                    {actor.profile ? (
                      <div className="catalog-card__text">{truncateText(toPlainText(actor.profile), 160)}</div>
                    ) : (
                      <div className="catalog-card__text">Profile text is not available yet.</div>
                    )}

                    <div className="catalog-card__footer">
                      <span className="catalog-link">View actor details</span>
                    </div>
                  </Link>
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
                Previous
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), gender })}
              >
                Next
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
