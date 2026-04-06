import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActorCoStarsClient } from "../../../../components/ActorCoStarsClient";
import { ActorProfileClient } from "../../../../components/ActorProfileClient";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { FavoriteButtonClient } from "../../../../components/FavoriteButtonClient";
import { ShareButtonClient } from "../../../../components/ShareButtonClient";
import {
  formatBirthday,
  getActorDetailBySlug,
  getAgeFromBirthday,
  groupPlayTimelineByYear,
  toPlainText,
} from "../../../../lib/stage-connect";
import { truncateText } from "../../../../lib/en-copy";

type Params = {
  slug: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;
export const dynamicParams = true;

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

  const description = truncateText(
    toPlainText(actor.profile || `${actor.name} actor archive page on Stage Connect.`),
    150
  );

  return {
    title: `${actor.name} | Actor archive | Stage Connect`,
    description,
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

  const birthdayText = formatBirthday(actor.birthday);
  const age = getAgeFromBirthday(actor.birthday);
  const timeline = groupPlayTimelineByYear(actor.plays);
  const hasSns = Boolean(actor.sns && Object.values(actor.sns).some(Boolean));
  const profileText = actor.profile || `${actor.name} profile text is not available yet.`;
  const shouldCollapseProfile = toPlainText(profileText).length > 260;

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "Actors", href: "/en/actors" }]} />

        <section className="hero-card stack-md">
          <div className="detail-hero-grid">
            <div className="detail-monogram" aria-hidden="true">
              {actor.name.trim().charAt(0)}
            </div>

            <div className="detail-hero-copy">
              <div className="title-subtle">Actor profile</div>
              <h1 className="page-title">{actor.name}</h1>
              {actor.kana ? <div className="muted">{actor.kana}</div> : null}
            </div>

            <div className="detail-actions">
              <FavoriteButtonClient slug={actor.slug} type="actor" size="lg" name={actor.name} kana={actor.kana} />
              <ShareButtonClient title={actor.name} text={`${actor.name} | Stage Connect`} />
            </div>

            <div className="pill-row">
              {birthdayText ? (
                <span className="pill">
                  Born: {birthdayText}
                  {age !== null ? ` (${age})` : ""}
                </span>
              ) : null}
              <span className="pill accent-pill">Appearances: {actor.plays.length}</span>
            </div>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Profile</h2>
          <ActorProfileClient text={profileText} collapsed={shouldCollapseProfile} />
        </section>

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
                      <div className="cast-name">{play.title}</div>
                      {play.franchiseName ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          {play.franchiseName}
                        </div>
                      ) : null}
                      {play.roleName ? <div className="cast-role">{play.roleName}</div> : null}
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
