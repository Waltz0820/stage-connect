import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { compactListPeriodEn, truncateText } from "../../../../lib/en-copy";
import { getCreditItems, getPlayDetailBySlug, summarizeCast, toPlainText } from "../../../../lib/stage-connect";

type Params = { slug: string };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export const revalidate = 3600;
export const dynamicParams = true;

const splitSlashList = (value?: string | null) =>
  String(value ?? "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) {
    return {
      title: "Play not found | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  const description = truncateText(
    toPlainText(play.summaryEn || play.summary || `${play.title} cast and production archive page on Stage Connect.`),
    150
  );

  return {
    title: `${play.title} | Cast, series, and streaming info | Stage Connect`,
    description,
    alternates: {
      canonical: `${siteUrl}/en/plays/${play.slug}`,
      languages: {
        ja: `${siteUrl}/plays/${play.slug}`,
        en: `${siteUrl}/en/plays/${play.slug}`,
      },
    },
  };
}

export default async function EnglishPlayDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) notFound();

  const creditItems = getCreditItems(play.credits);
  const castSummary = summarizeCast(play.cast);
  const hasVod = Boolean(play.vod && Object.keys(play.vod).length > 0);
  const venues = splitSlashList(play.venue);
  const featuredCast = play.cast.slice(0, 12);
  const synopsis = play.summaryEn || play.summary;

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Plays", href: "/en/plays" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm detail-ledger-shell">
            {play.franchiseSlug && play.franchiseName ? (
              <Link className="pill series-pill" href={`/en/series/${play.franchiseSlug}`}>
                Series: {play.franchiseName}
              </Link>
            ) : null}

            <h1 className="page-title">{play.title}</h1>

            <div className="pill-row">
              {play.tags.map((tag) => (
                <span className="pill" key={tag}>
                  #{tag}
                </span>
              ))}
              {hasVod ? <span className="pill accent-pill">Streaming available</span> : null}
            </div>

            <div className="detail-ledger">
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Cast</span>
                <strong>{play.cast.length}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Series</span>
                <strong>{play.franchiseName || "Standalone"}</strong>
              </div>
              <div className="detail-ledger__item">
                <span className="detail-ledger__label">Streaming</span>
                <strong>{hasVod ? "Available" : "Unavailable"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <p className="lead">
            <strong className="strong-inline">{play.title}</strong> is listed with cast, series connection, public
            schedule, venue, and streaming availability. Featured cast includes {castSummary}.
          </p>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Synopsis</h2>
          <div className="rich-text">{synopsis || "Synopsis not available yet."}</div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Public information</h2>
          <div className="meta-list roomy">
            {play.period ? (
              <div className="meta-row">
                <div className="meta-label accent-label">Schedule</div>
                <div className="meta-value">
                  <div>{compactListPeriodEn(play.period) || play.period}</div>
                  <div className="subtle-line">{play.period}</div>
                </div>
              </div>
            ) : null}
            {play.venue ? (
              <div className="meta-row">
                <div className="meta-label accent-label">Venues</div>
                <div className="meta-value">
                  <div>{venues.slice(0, 3).join(" / ")}</div>
                  {venues.length > 3 ? <div className="subtle-line">and {venues.length - 3} more venues</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {creditItems.length > 0 ? (
          <section className="section-card stack-md">
            <h2 className="section-title">Credits</h2>
            <div className="meta-list roomy">
              {creditItems.slice(0, 6).map((item) => (
                <div className="meta-row" key={`${item.role}-${item.names.join("-")}`}>
                  <div className="meta-label accent-label">{item.role}</div>
                  <div className="meta-value">{item.names.join(" / ")}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-card stack-md">
          <h2 className="section-title">Streaming</h2>
          <p className="muted">
            {hasVod
              ? "This production currently has streaming availability listed on Stage Connect."
              : "No streaming platform is listed for this production at the moment."}
          </p>
          <div className="action-row">
            {play.vod?.dmm ? (
              <a className="action-button action-button-primary" href={play.vod.dmm} target="_blank" rel="noopener noreferrer">
                Watch on DMM TV
              </a>
            ) : null}
            {play.vod?.unext ? (
              <a className="action-button" href={play.vod.unext} target="_blank" rel="noopener noreferrer">
                Watch on U-NEXT
              </a>
            ) : null}
            {play.vod?.danime ? (
              <a className="action-button" href={play.vod.danime} target="_blank" rel="noopener noreferrer">
                Watch on d Anime Store
              </a>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Featured cast</h2>
          <div className="cast-grid">
            {featuredCast.map((item) => (
              <Link href={`/en/actors/${item.slug}`} className="cast-card cast-card-link" key={`${item.slug}-${item.roleName ?? "cast"}`}>
                <div className="cast-name">{item.name}</div>
                {item.roleName ? <div className="cast-role">{item.roleName}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
