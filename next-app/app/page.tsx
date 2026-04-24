import type { Metadata } from "next";
import Link from "next/link";
import { PlayPosterFrame } from "../components/PlayPosterFrame";
import { getActorList, getPlayList, getSeriesList, getTrendingTags } from "../lib/stage-connect";

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
  title: "Stage Connect（ステコネ） | 2.5次元舞台・ミュージカルのキャスト・作品アーカイブ",
  description:
    "Stage Connect（ステコネ）は、2.5次元舞台・ミュージカルの作品とキャストをつなぐデジタルアーカイブです。出演者・配信（VOD）・公演情報・シリーズ情報をまとめて確認できます。",
  alternates: {
    canonical: siteUrl,
    languages: {
      ja: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
};

const HOME_ACTIONS: HomeAction[] = [
  {
    href: "/actors",
    title: "俳優を探す",
    text: "出演作・プロフィール・つながりから探す",
    accent: true,
    icon: "person",
  },
  {
    href: "/plays",
    title: "作品を探す",
    text: "舞台作品・キャスト・配信情報を探す",
    icon: "ticket",
  },
  {
    href: "/series",
    title: "シリーズを探す",
    text: "人気シリーズや世界観から探す",
    icon: "box",
  },
];

const renderIcon = (type: "person" | "ticket" | "box") => {
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
};

export default async function HomePage() {
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
              2.5次元舞台と
              <br />
              キャストをつなぐ
            </h1>
            <p className="home-stage__lead">
              作品・シリーズ・出演者・配信情報を横断して追える。
              <br />
              2.5次元舞台に特化したデジタルアーカイブ。
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
              <span className="home-stage__stat-label">俳優</span>
              <strong>{actorsCount.toLocaleString()}+</strong>
            </div>
            <div className="home-stage__stat">
              <span className="home-stage__stat-label">作品</span>
              <strong>{playsCount.toLocaleString()}+</strong>
            </div>
            <div className="home-stage__stat">
              <span className="home-stage__stat-label">VOD対応</span>
              <strong>{vodCount.toLocaleString()}+</strong>
            </div>
          </div>

          <section className="home-stage__section home-stage__section--open">
            <div className="home-stage__section-head">
              <h2>人気シリーズ</h2>
              <Link href="/series">すべて見る</Link>
            </div>
            <div className="home-stage__series-grid">
              {featuredSeries.map((item) => (
                <Link key={item.slug} href={`/series/${item.slug}`} className="home-stage__series-card">
                  <PlayPosterFrame title={item.name} seed={`${item.slug}-${item.originType ?? ""}`} />
                  <div className="home-stage__series-copy">
                    <span>
                      {item.format === "musical" ? "ミュージカル" : item.format === "stage" ? "舞台" : "シリーズ"} /{" "}
                      {item.playCount}作品
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="home-stage__section home-stage__section--open">
            <div className="home-stage__section-head">
              <h2>注目タグ</h2>
              <Link href="/tags">すべて見る</Link>
            </div>
            <div className="home-stage__tag-grid">
              {trendingTags.map((item) => (
                <Link key={item.slug} href={`/tags/${encodeURIComponent(item.slug)}`} className="home-stage__tag">
                  #{item.tag}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
