import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingTags } from "../../lib/stage-connect";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const revalidate = 3600;

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

export default async function EnglishHomePage() {
  const trendingTags = await getTrendingTags(25);

  const watchLinks = [
    { key: "vod", label: "Streaming", to: "/watch" },
    { key: "dmm", label: "DMM TV", to: "/watch/dmm" },
    { key: "unext", label: "U-NEXT", to: "/watch/u-next" },
  ];

  const getTagStyle = (rank: number) => {
    if (rank <= 3) return "tag-cloud-link is-rank-1";
    if (rank <= 8) return "tag-cloud-link is-rank-2";
    if (rank <= 15) return "tag-cloud-link is-rank-3";
    return "tag-cloud-link is-rank-4";
  };

  const getWatchStyle = (key: string) => {
    if (key === "vod") return "tag-cloud-link is-watch-vod";
    if (key === "dmm") return "tag-cloud-link is-watch-dmm";
    if (key === "unext") return "tag-cloud-link is-watch-unext";
    return "tag-cloud-link";
  };

  return (
    <main className="home-hero">
      <div className="home-hero__spotlight" />
      <div className="home-hero__inner">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">Stage Connect</span>

          <h1 className="home-hero__title">
            Track 2.5D stage works
            <span className="is-accent">through cast and series</span>
          </h1>

          <p className="home-hero__lead">
            A digital archive for Japanese 2.5D stage plays and musicals.
            Follow productions, series lines, and cast history from one place.
          </p>
        </div>

        <div className="home-hero__actions">
          <Link href="/en/plays" className="home-hero__button is-primary">
            Browse plays
          </Link>
          <Link href="/en/series" className="home-hero__button">
            Browse series
          </Link>
          <Link href="/guide" className="home-hero__button">
            Editorial guides
          </Link>
        </div>

        <div className="home-tag-cloud">
          <h3 className="home-tag-cloud__title">
            <span />
            Trending tags
            <span />
          </h3>

          <div className="home-tag-cloud__items">
            {watchLinks.map((item) => (
              <Link key={item.key} href={item.to} className={getWatchStyle(item.key)}>
                #{item.label}
                <span className="home-tag-cloud__arrow">→</span>
              </Link>
            ))}

            {trendingTags.map((item) => (
              <Link
                key={item.slug}
                href={`/tags/${encodeURIComponent(item.slug)}`}
                className={getTagStyle(item.rank)}
              >
                #{item.tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
