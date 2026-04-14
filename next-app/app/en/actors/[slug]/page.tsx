import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActorCoStarsClient } from "../../../../components/ActorCoStarsClient";
import { ActorTopSeriesClient } from "../../../../components/ActorTopSeriesClient";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../../../components/FavoriteButtonClient";
import { ShareButtonClient } from "../../../../components/ShareButtonClient";
import { StructuredData } from "../../../../components/StructuredData";
import { getActorDetailBySlug, getAgeFromBirthday, groupPlayTimelineByYear, toPlainText } from "../../../../lib/stage-connect";
import {
  formatAgeEn,
  formatBirthdayEn,
  formatBirthdayLabelEn,
  getEnglishActorName,
  getEnglishPlayTitle,
  getEnglishSeriesName,
  translateAnnotatedDisplayTextEn,
  translateDisplayTextEn,
  truncateText,
} from "../../../../lib/en-copy";
import { buildBreadcrumbList } from "../../../../lib/structured-data";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

const buildActorMetaDescriptionEn = (actor: NonNullable<Awaited<ReturnType<typeof getActorDetailBySlug>>>) => {
  const parts: string[] = [];
  const statusLine = toPlainText(actor.profile || "").trim().replace(/[.。]\s*$/u, "");

  if (statusLine) parts.push(`${statusLine}.`);

  const factParts: string[] = [];
  if (actor.heightCm !== null) factParts.push(`Height ${actor.heightCm} cm`);
  if (actor.bloodType) factParts.push(`Blood type ${actor.bloodType}`);
  if (factParts.length > 0) parts.push(`${factParts.join(", ")}.`);

  if (actor.topSeries.length > 0) {
    const topNames = actor.topSeries
      .slice(0, 2)
      .map((item) => `"${getEnglishSeriesName({ name: item.name, nameEn: item.nameEn })}"`);
    parts.push(`Major series include ${topNames.join(" and ")}.`);
  }

  parts.push(`${actor.plays.length} credited works. Includes appearance timeline and co-star links.`);
  return truncateText(parts.join(" "), 150);
};

const formatTimelineLeadDate = (period?: string | null) => {
  const value = String(period ?? "").trim();
  if (!value) return null;

  const fullDate = value.match(/(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (fullDate) {
    const [, year, month, day] = fullDate;
    return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}-`;
  }

  const yearMonth = value.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearOnly = value.match(/(\d{4})/);
  if (yearOnly) return `${yearOnly[1]}-`;

  return value;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) {
    return {
      title: "Actor not found | Stage Connect",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const displayName = getEnglishActorName(actor);

  return {
    title: `${displayName} | Actor archive | Stage Connect`,
    description: buildActorMetaDescriptionEn(actor),
    alternates: {
      canonical: `${siteUrl}/en/actors/${actor.slug}`,
      languages: {
        ja: `${siteUrl}/actors/${actor.slug}`,
        en: `${siteUrl}/en/actors/${actor.slug}`,
      },
    },
  };
}

export default async function EnglishActorDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const actor = await getActorDetailBySlug(slug);

  if (!actor) notFound();

  const displayName = getEnglishActorName(actor);
  const birthdayText = actor.birthdayLabel
    ? formatBirthdayLabelEn(actor.birthdayLabel)
    : formatBirthdayEn(actor.birthday);
  const age = getAgeFromBirthday(actor.birthday);
  const ageLabel = formatAgeEn(age);
  const timeline = groupPlayTimelineByYear(actor.plays);
  const hasSns = Boolean(actor.sns && Object.values(actor.sns).some(Boolean));
  const statusLine = toPlainText(actor.profile || "") || `${displayName} profile text is not available yet.`;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    alternateName: actor.name || actor.kana || undefined,
    description: statusLine,
    url: `${siteUrl}/en/actors/${actor.slug}`,
    birthDate: actor.birthday || undefined,
    sameAs: Object.values(actor.sns || {}).filter(Boolean),
  };
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "HOME", path: "/en" },
    { name: "Actors", path: "/en/actors" },
    { name: displayName, path: `/en/actors/${actor.slug}` },
  ]);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <StructuredData data={breadcrumbJsonLd} />
      <StructuredData data={personJsonLd} />
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Actors", href: "/en/actors" }]} />

        <section className="hero-card stack-md">
          <div className="detail-hero-grid">
            <div className="detail-monogram" aria-hidden="true">
              {displayName.trim().charAt(0)}
            </div>

            <div className="detail-hero-copy">
              <h1 className="page-title">{displayName}</h1>
              {actor.kana ? <div className="muted">{actor.kana}</div> : null}
              <p className="detail-status-line">{statusLine}</p>
            </div>

            <div className="detail-actions">
              <FavoriteButtonClient slug={actor.slug} type="actor" size="lg" name={displayName} kana={actor.kana} />
              <ShareButtonClient title={displayName} text={`${displayName} | Stage Connect`} />
            </div>

            <div className="pill-row">
              {birthdayText ? (
                <span className="pill">
                  DOB: {birthdayText}
                  {ageLabel ? ` / ${ageLabel}` : ""}
                </span>
              ) : null}
              {actor.heightCm !== null ? <span className="pill">Height: {actor.heightCm}cm</span> : null}
              {actor.bloodType ? <span className="pill">Blood type: {actor.bloodType}</span> : null}
              <span className="pill accent-pill">Appearances: {actor.plays.length}</span>
            </div>
          </div>
        </section>

        {actor.topSeries.length > 0 ? (
          <ActorTopSeriesClient items={actor.topSeries} locale="en" />
        ) : null}

        <section className="section-card stack-md">
          <h2 className="section-title">Appearance timeline</h2>
          <div className="timeline-shell">
            {timeline.map((group) => (
              <section key={group.year} className="timeline-year-block">
                <div className="timeline-dot" />
                <div className="timeline-year-heading">
                  <span className="timeline-year">{group.year}</span>
                  <span className="timeline-year-sub">release year</span>
                </div>

                <div className="cast-grid cast-grid-wide">
                  {group.plays.map((play) => (
                    <Link className="cast-card cast-card-link" href={`/en/plays/${play.slug}`} key={play.slug}>
                      <div className="cast-name">{getEnglishPlayTitle(play)}</div>
                      {play.franchiseName ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          {getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn })}
                        </div>
                      ) : null}
                      {play.roleName ? <div className="cast-role">{translateAnnotatedDisplayTextEn(play.roleName)}</div> : null}
                      {formatTimelineLeadDate(play.period) ? (
                        <div className="subtle-line" style={{ marginTop: 10 }}>
                          {formatTimelineLeadDate(play.period)}
                        </div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        {actor.coStars.length > 0 ? <ActorCoStarsClient coStars={actor.coStars} /> : null}

        <section className="section-card stack-md">
          <h2 className="section-title">Official links</h2>
          {hasSns ? (
            <div className="action-row">
              {actor.sns?.x ? (
                <a className="action-button" href={actor.sns.x} target="_blank" rel="noopener noreferrer">
                  X
                </a>
              ) : null}
              {actor.sns?.instagram ? (
                <a className="action-button" href={actor.sns.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              ) : null}
              {actor.sns?.official ? (
                <a className="action-button action-button-primary" href={actor.sns.official} target="_blank" rel="noopener noreferrer">
                  Official site
                </a>
              ) : null}
              {actor.sns?.youtube ? (
                <a className="action-button" href={actor.sns.youtube} target="_blank" rel="noopener noreferrer">
                  YouTube
                </a>
              ) : null}
            </div>
          ) : (
            <p className="muted">No official links are listed yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
