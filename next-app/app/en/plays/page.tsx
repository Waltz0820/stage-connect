import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { compactListPeriodEn, EN_FORMAT_LABELS, EN_GENRE_LABELS, truncateText } from "../../../lib/en-copy";
import { getPlayList, periodSortKey, toPlainText } from "../../../lib/stage-connect";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

const ITEMS_PER_PAGE = 12;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

const getSingleParam = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value) ?? "";

const buildHref = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/en/plays?${query}` : "/en/plays";
};

export const metadata: Metadata = {
  title: "2.5D Plays | Stage Connect",
  description:
    "Browse 2.5D stage plays and musicals by release order and genre on Stage Connect.",
  alternates: {
    canonical: `${siteUrl}/en/plays`,
    languages: {
      ja: `${siteUrl}/plays`,
      en: `${siteUrl}/en/plays`,
    },
  },
};

export default async function EnglishPlaysPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allPlays = await getPlayList();

  const sort = getSingleParam(params.sort) === "old" ? "old" : "new";
  const requestedFormat = getSingleParam(params.format);
  const format = requestedFormat && requestedFormat in EN_FORMAT_LABELS ? requestedFormat : "all";
  const requestedGenre = getSingleParam(params.genre);
  const genre = requestedGenre && requestedGenre in EN_GENRE_LABELS ? requestedGenre : "all";
  const requestedPage = Number(getSingleParam(params.page));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const formatOptions = ["all", ...Object.keys(EN_FORMAT_LABELS)];
  const genreOptions = ["all", ...Object.keys(EN_GENRE_LABELS)];

  const formatFiltered =
    format === "all" ? allPlays : allPlays.filter((play) => String(play.franchiseFormat ?? "") === format);
  const filtered =
    genre === "all" ? formatFiltered : formatFiltered.filter((play) => String(play.genre ?? "") === genre);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "old") return periodSortKey(a.period) - periodSortKey(b.period);
    return periodSortKey(b.period) - periodSortKey(a.period);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const visible = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Plays", href: "/en/plays" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Plays</span>
            <h1 className="page-title">2.5D Plays</h1>
            <p className="lead">
              Browse stage plays and musicals by release order, performance format, and genre.
            </p>
          </div>

          <div className="catalog-summary catalog-summary--ledger">
            <span className="catalog-chip">Showing {filtered.length}</span>
            <span className="catalog-chip">All plays {allPlays.length}</span>
            <span className="catalog-chip">Page {safePage}</span>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Filters</h2>

          <div className="filter-row filter-row--dense">
            <Link
              className={`filter-chip ${sort === "new" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "new", format, genre })}
            >
              Newest first
            </Link>
            <Link
              className={`filter-chip ${sort === "old" ? "is-active" : ""}`}
              href={buildHref({ page: 1, sort: "old", format, genre })}
            >
              Oldest first
            </Link>
          </div>

          <div className="filter-row filter-row--dense genre-filter-row">
            {formatOptions.map((option) => (
              <Link
                key={option}
                className={`filter-chip ${format === option ? "is-active" : ""}`}
                href={buildHref({ page: 1, sort, format: option, genre })}
              >
                {option === "all" ? "All formats" : EN_FORMAT_LABELS[option]}
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
                {option === "all" ? "All genres" : EN_GENRE_LABELS[option]}
              </Link>
            ))}
          </div>

          <div className="catalog-grid">
            {visible.map((play) => (
              <article className="catalog-card" key={play.slug}>
                <Link className="catalog-card__body-link" href={`/en/plays/${play.slug}`}>
                  <div className="catalog-card__top catalog-card__top--stack">
                    <div className="catalog-card__title">{play.title}</div>
                    <div className="catalog-card__top-actions">
                      {format === "all" && play.franchiseFormat ? (
                        <span className="catalog-card__badge">
                          {EN_FORMAT_LABELS[play.franchiseFormat] ?? play.franchiseFormat}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {play.franchiseName ? <div className="catalog-card__sub">{play.franchiseName}</div> : null}
                  {compactListPeriodEn(play.period) ? (
                    <div className="catalog-card__sub">Date: {compactListPeriodEn(play.period)}</div>
                  ) : null}
                  {play.genre ? (
                    <div className="catalog-card__sub">
                      Genre: {EN_GENRE_LABELS[play.genre] ?? play.genre}
                    </div>
                  ) : null}

                  <div className="catalog-card__text">
                    {play.summary
                      ? truncateText(toPlainText(play.summary), 160)
                      : "Summary not available yet."}
                  </div>

                  <div className="catalog-card__footer">
                    <span className="catalog-link">View play details</span>
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
                Previous
              </Link>
              <span className="catalog-note">
                Page {safePage} / {totalPages}
              </span>
              <Link
                className={`pagination-link ${safePage === totalPages ? "is-disabled" : ""}`}
                href={buildHref({ page: Math.min(totalPages, safePage + 1), sort, format, genre })}
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
