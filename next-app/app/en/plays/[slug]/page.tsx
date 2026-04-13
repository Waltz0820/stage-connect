import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { StructuredData } from "../../../../components/StructuredData";
import { compactListPeriodEn, getEnglishActorName, getEnglishSeriesName, truncateText } from "../../../../lib/en-copy";
import { buildBreadcrumbList } from "../../../../lib/structured-data";
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

const buildPlayMetaDescriptionEn = (play: NonNullable<Awaited<ReturnType<typeof getPlayDetailBySlug>>>) => {
  const parts: string[] = [];
  const displaySeriesName = play.franchiseName
    ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn })
    : null;
  const summary = toPlainText(play.summaryEn || play.summary || "").trim().replace(/[.。]\s*$/u, "");

  if (summary) parts.push(`${summary}.`);

  const factParts: string[] = [];
  if (displaySeriesName) factParts.push(`Series: ${displaySeriesName}`);
  if (play.cast.length > 0) factParts.push(`Cast: ${play.cast.length}`);
  if (play.vod && Object.keys(play.vod).length > 0) factParts.push("Streaming available");
  if (factParts.length > 0) parts.push(`${factParts.join(" / ")}.`);

  if (parts.length === 0) {
    parts.push(`${play.title} cast, series, and streaming archive page on Stage Connect.`);
  } else {
    parts.push("Includes cast, credits, and schedule details.");
  }

  return truncateText(parts.join(" "), 150);
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayDetailBySlug(slug);

  if (!play) {
    return {
      title: "Play not found | Stage Connect",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${play.title} | Cast, series, and streaming info | Stage Connect`,
    description: buildPlayMetaDescriptionEn(play),
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
  const displaySeriesName = play.franchiseName
    ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn })
    : null;
  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: play.title,
    description: toPlainText(
      synopsis || `${play.title} cast and production archive page on Stage Connect.`
    ),
    url: `${siteUrl}/en/plays/${play.slug}`,
    keywords: play.tags.join(", "),
    about: displaySeriesName || undefined,
    actor: play.cast.slice(0, 20).map((item) => ({
      "@type": "Person",
      name: getEnglishActorName(item),
      url: `${siteUrl}/en/actors/${item.slug}`,
    })),
  };
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Plays", path: "/en/plays" },
    { name: play.title, path: `/en/plays/${play.slug}` },
  ]);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={creativeWorkJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Plays", href: "/en/plays" }]} />

        <section className="hero-card stack-md">
          <div className="stack-sm detail-ledger-shell">
            {play.franchiseSlug && displaySeriesName ? (
              <Link className="pill series-pill" href={`/en/series/${play.franchiseSlug}`}>
                Series: {displaySeriesName}
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
                <strong>{displaySeriesName || "Standalone"}</strong>
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
                <div className="cast-name">{getEnglishActorName(item)}</div>
                {item.roleName ? <div className="cast-role">{item.roleName}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
