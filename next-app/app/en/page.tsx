import type { Metadata } from "next";
import Link from "next/link";
import { PlayPosterFrame } from "../../components/PlayPosterFrame";
import { getEnglishSeriesName } from "../../lib/en-copy";
import { getActorList, getPlayList, getSeriesList, getTrendingTags } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;

type HomeAction = {
  href: string;
  title: string;
  text: string;
  accent?: boolean;
  icon: "person" | "ticket" | "box";
};

export const metadata: Metadata = {
  title: "Stage Connect | 2.5D Stage Play & Musical Archive",
  description:
    "Stage Connect is a digital archive for 2.5D stage plays and musicals. Browse productions, series, cast connections, and streaming availability from one place.",
  alternates: {
    canonical: `${siteUrl}/en`,
    languages: {
      ja: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
};

const HOME_ACTIONS: HomeAction[] = [
  {
    href: "/en/actors",
    title: "Browse actors",
    text: "Explore cast profiles, credits, and connections",
    accent: true,
    icon: "person",
  },
  {
    href: "/en/plays",
    title: "Browse plays",
    text: "Search productions, casts, and streaming links",
    icon: "ticket",
  },
  {
    href: "/en/series",
    title: "Browse series",
    text: "Start from major franchise lines and worlds",
    icon: "box",
  },
];

const renderIcon = (type: "person" | "ticket" | "box" | "play") => {
  if (type === "person") {
    return (
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4.5 16.25c.7-2.28 2.58-3.75 5.5-3.75s4.8 1.47 5.5 3.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "ticket") {
    return (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M4 5.25h12v2.1a1.9 1.9 0 0 0 0 3.3v2.1H4v-2.1a1.9 1.9 0 0 0 0-3.3v-2.1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6.5v7M12 6.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "box") {
    return (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3 15.5 6v8L10 17l-5.5-3V6L10 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M4.5 6 10 9l5.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 9v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none">
      <path
        d="M4 5.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m8.2 8 4.4 2-4.4 2V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

export default async function EnglishHomePage() {
  const [trendingTags, actors, plays, series] = await Promise.all([
    getTrendingTags(6),
    getActorList(),
    getPlayList(),
    getSeriesList(),
  ]);

  const featuredSeries = series.slice(0, 4);
  const actorsCount = actors.length;
  const playsCount = plays.length;
  const vodCount = plays.filter((play) => play.vod && Object.keys(play.vod).length > 0).length;

  return (
    <main className="home-shell">
      <section className="home-stage">
        <div className="home-stage__ambient" />
        <div className="home-stage__grid">
          <div className="home-stage__hero">
            <h1 className="home-stage__title">
              Track 2.5D stage works
              <br />
              through cast and series
            </h1>
            <p className="home-stage__lead">
              Browse productions, series lines, cast history, and streaming availability
              <br />
              from one dark, stage-inspired archive.
            </p>
          </div>

          <div className="home-stage__actions">
            {HOME_ACTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`home-stage__action ${item.accent ? "is-accent" : ""}`}
              >
                <span className="home-stage__action-icon" aria-hidden="true">
                  {renderIcon(item.icon)}
                </span>
                <span className="home-stage__action-copy">
                  <span className="home-stage__action-title">{item.title}</span>
                  <span className="home-stage__action-text">{item.text}</span>
                </span>
                <span className="home-stage__action-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>

          <div className="home-stage__stats">
            <div className="home-stage__stat">
              <span className="home-stage__stat-label">Actors</span>
              <strong>{actorsCount.toLocaleString()}+</strong>
            </div>
            <div className="home-stage__stat">
              <span className="home-stage__stat-label">Works</span>
              <strong>{playsCount.toLocaleString()}+</strong>
            </div>
            <div className="home-stage__stat">
              <span className="home-stage__stat-label">Streaming</span>
              <strong>{vodCount.toLocaleString()}+</strong>
            </div>
          </div>

          <section className="home-stage__section">
            <div className="home-stage__section-head">
              <h2>Popular series</h2>
              <Link href="/en/series">View all</Link>
            </div>
            <div className="home-stage__series-grid">
              {featuredSeries.map((item) => (
                <Link key={item.slug} href={`/en/series/${item.slug}`} className="home-stage__series-card">
                  <PlayPosterFrame title={getEnglishSeriesName(item)} seed={`${item.slug}-${item.originType ?? ""}`} />
                  <div className="home-stage__series-copy">
                    <strong>{getEnglishSeriesName(item)}</strong>
                    <span>
                      {item.format === "musical" ? "Musical" : item.format === "stage" ? "Stage" : "Series"} /{" "}
                      {item.playCount} works
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="home-stage__section">
            <div className="home-stage__section-head">
              <h2>Trending tags</h2>
              <Link href="/tags">View all</Link>
            </div>
            <div className="home-stage__tag-grid">
              {trendingTags.map((item) => (
                <Link key={item.slug} href={`/tags/${encodeURIComponent(item.slug)}`} className="home-stage__tag">
                  #{item.tag}
                </Link>
              ))}
            </div>
          </section>

          <section className="home-stage__watch">
            <div className="home-stage__watch-copy">
              <span className="home-stage__watch-icon" aria-hidden="true">
                {renderIcon("play")}
              </span>
              <div>
                <h2>Watch by platform</h2>
                <p>Check DMM TV and U-NEXT for works that are currently streaming.</p>
              </div>
            </div>
            <div className="home-stage__watch-actions">
              <Link href="/watch/dmm" className="home-stage__watch-button is-accent">
                Watch on DMM TV
              </Link>
              <Link href="/watch/u-next" className="home-stage__watch-button">
                Watch on U-NEXT
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
